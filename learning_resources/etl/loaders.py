"""Course catalog data loaders"""
import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Exists, OuterRef

from learning_resources.constants import (
    LearningResourceRelationTypes,
    LearningResourceType,
)
from learning_resources.etl.constants import (
    CourseLoaderConfig,
    OfferedByLoaderConfig,
    PlaylistLoaderConfig,
    ProgramLoaderConfig,
    VideoLoaderConfig,
)
from learning_resources.etl.deduplication import get_most_relevant_run
from learning_resources.etl.exceptions import ExtractException
from learning_resources.etl.utils import extract_topics
from learning_resources.models import (
    ContentFile,
    Course,
    LearningResource,
    LearningResourceImage,
    LearningResourceInstructor,
    LearningResourceOfferor,
    LearningResourcePlatform,
    LearningResourceRun,
    LearningResourceTopic,
    Playlist,
    PlaylistVideo,
    Program,
    Video,
    VideoChannel,
)
from learning_resources.utils import load_course_blocklist, load_course_duplicates

log = logging.getLogger()

User = get_user_model()


def load_topics(resource, topics_data):
    """Load the topics for a resource into the database"""
    if topics_data is not None:
        topics = []

        for topic_data in topics_data:
            topic, _ = LearningResourceTopic.objects.get_or_create(
                name=topic_data["name"]
            )
            topics.append(topic)

        resource.topics.set(topics)
        resource.save()
    return resource.topics.all()


def load_instructors(resource, instructors_data):
    """Load the instructors for a resource into the database"""
    instructors = []

    for instructor_data in instructors_data:
        if "full_name" not in instructor_data:
            instructor_data["full_name"] = instructor_data.get("title", None)

        instructor, _ = LearningResourceInstructor.objects.get_or_create(
            **instructor_data
        )
        instructors.append(instructor)

    resource.instructors.set(instructors)
    resource.save()
    return instructors


def load_image(resource, image_data):
    """Load the image for a resource into the database"""
    if image_data:
        image, _ = LearningResourceImage.objects.get_or_create(**image_data)

        resource.image = image
    else:
        resource.image = None
        image = None
    resource.save()
    return image


def load_offered_bys(resource, offered_bys_data, *, config=OfferedByLoaderConfig()):
    """# noqa: D401
    Loads a list of offered_by into the resource.

    Args:
        resource (LearningResource): learning resource
        offered_bys_data (list of dict): the offered by data for the resource
        config (OfferedByLoaderConfig): loader configuration

    Returns:
        offered_bys (list of LearningResourceOfferor): list of created or updated offered_bys
    """  # noqa: E501
    if offered_bys_data is None:
        return resource.offered_by.all()

    offered_bys = []

    for offered_by_data in offered_bys_data:
        offered_by, _ = LearningResourceOfferor.objects.get_or_create(
            name=offered_by_data["name"]
        )
        if config.additive:
            resource.offered_by.add(offered_by)
        offered_bys.append(offered_by)

    if not config.additive:
        resource.offered_by.set(offered_bys)

    resource.save()
    return offered_bys


def load_run(learning_resource, run_data):
    """
    Load the resource run into the database

    Args:
        learning_resource (LearningResource): the concrete parent learning resource
        run_data (dict): dictionary of data to create/update the run with

    Returns:
        LearningResourceRun: the created/updated resource run
    """
    run_id = run_data.pop("run_id")
    instructors_data = run_data.pop("instructors", [])

    with transaction.atomic():
        (
            learning_resource_run,
            _,
        ) = LearningResourceRun.objects.select_for_update().update_or_create(
            run_id=run_id,
            defaults={
                **run_data,
                "learning_resource": learning_resource,
            },
        )

        load_instructors(learning_resource_run, instructors_data)

    return learning_resource_run


def load_course(  # noqa: C901
    course_data, blocklist, duplicates, *, config=CourseLoaderConfig()
):  # noqa: C901, RUF100
    """
    Load the course into the database

    Args:
        course_data (dict):
            a dict of course data values
        blocklist (list of str):
            list of course ids not to load
        duplicates (list of dict):
            list of duplicate course data
        config (CourseLoaderConfig):
            configuration on how to load this program

    Returns:
        Course:
            the created/updated course
    """
    # pylint: disable=too-many-branches,too-many-locals
    platform_name = course_data.pop("platform")
    readable_id = course_data.pop("readable_id")
    runs_data = course_data.pop("runs", [])
    topics_data = course_data.pop("topics", None)
    offered_bys_data = course_data.pop("offered_by", [])
    image_data = course_data.pop("image", None)

    if readable_id in blocklist or not runs_data:
        course_data["published"] = False

    deduplicated_course_id = next(
        (
            record["course_id"]
            for record in duplicates
            if readable_id in record["duplicate_course_ids"]
        ),
        None,
    )

    with transaction.atomic():
        platform = LearningResourcePlatform.objects.get(platform=platform_name)

        if deduplicated_course_id:
            # intentionally not updating if the course doesn't exist
            (
                learning_resource,
                created,
            ) = LearningResource.objects.select_for_update().get_or_create(
                platform=platform,
                readable_id=deduplicated_course_id,
                resource_type=LearningResourceType.course.value,
                defaults=course_data,
            )

            if readable_id != deduplicated_course_id:
                duplicate_resource = LearningResource.objects.filter(
                    platform=platform, readable_id=readable_id
                ).first()
                if duplicate_resource:
                    duplicate_resource.published = False
                    duplicate_resource.save()
        else:
            (
                learning_resource,
                created,
            ) = LearningResource.objects.select_for_update().update_or_create(
                platform=platform, readable_id=readable_id, defaults=course_data
            )

        Course.objects.get_or_create(learning_resource=learning_resource)

        run_ids_to_update_or_create = [run["run_id"] for run in runs_data]

        for course_run_data in runs_data:
            load_run(learning_resource, course_run_data)

        if deduplicated_course_id and not created:
            most_relevent_run = get_most_relevant_run(learning_resource.runs.all())

            if most_relevent_run.run_id in run_ids_to_update_or_create:
                for attr, val in course_data.items():
                    setattr(learning_resource, attr, val)
                learning_resource.save()

        unpublished_runs = []
        if config.prune:
            # mark runs no longer included here as unpublished
            for run in learning_resource.runs.exclude(
                run_id__in=run_ids_to_update_or_create
            ).filter(published=True):
                run.published = False
                run.save()
                unpublished_runs.append(run.id)

        load_topics(learning_resource, topics_data)
        load_offered_bys(learning_resource, offered_bys_data, config=config.offered_by)
        load_image(learning_resource, image_data)

    # if not created and not course.published:
    #    for run_id in unpublished_runs:

    return learning_resource


def load_courses(platform, courses_data, *, config=CourseLoaderConfig()):
    """
    Load a list of courses

    Args:
        courses_data (list of dict):
            a list of course data values
        config (CourseLoaderConfig):
            configuration on how to load this program
    """
    blocklist = load_course_blocklist()
    duplicates = load_course_duplicates(platform)

    courses_list = list(courses_data or [])

    courses = [
        load_course(course, blocklist, duplicates, config=config)
        for course in courses_list
    ]

    if courses and config.prune:
        for course in LearningResource.objects.filter(
            platform__platform=platform, resource_type=LearningResourceType.course.value
        ).exclude(id__in=[course.id for course in courses]):
            course.published = False
            course.save()

    return courses


def load_program(program_data, blocklist, duplicates, *, config=ProgramLoaderConfig()):
    """
    Load the program into the database

    Args:
        program_data (dict):
            a dict of program data values
        blocklist (list of str):
            list of course ids not to load
        duplicates (list of dict):
            list of duplicate course data
        config (ProgramLoaderConfig):
            configuration on how to load this program

    Returns:
        Program:
            the created/updated program
    """
    # pylint: disable=too-many-locals

    readable_id = program_data.pop("readable_id")
    courses_data = program_data.pop("courses")
    topics_data = program_data.pop("topics", [])
    runs_data = program_data.pop("runs", [])
    offered_bys_data = program_data.pop("offered_by", [])
    image_data = program_data.pop("image", None)
    platform_name = program_data.pop("platform")

    course_resources = []
    with transaction.atomic():
        # lock on the program record
        platform = LearningResourcePlatform.objects.get(platform=platform_name)

        (
            learning_resource,
            created,  # pylint: disable=unused-variable
        ) = LearningResource.objects.select_for_update().update_or_create(
            readable_id=readable_id,
            platform=platform,
            resource_type=LearningResourceType.program.value,
            defaults=program_data,
        )

        load_topics(learning_resource, topics_data)
        load_image(learning_resource, image_data)
        load_offered_bys(learning_resource, offered_bys_data, config=config.offered_by)

        program, _ = Program.objects.get_or_create(learning_resource=learning_resource)

        run_ids_to_update_or_create = [run["run_id"] for run in runs_data]

        for run_data in runs_data:
            load_run(learning_resource, run_data)

        unpublished_runs = []
        if config.prune:
            # mark runs no longer included here as unpublished
            for run in learning_resource.runs.exclude(
                run_id__in=run_ids_to_update_or_create
            ).filter(published=True):
                run.published = False
                run.save()
                unpublished_runs.append(run.id)

        for course_data in courses_data:
            # skip courses that don't define a readable_id
            if not course_data.get("readable_id", None):
                continue

            course_resource = load_course(
                course_data, blocklist, duplicates, config=config.courses
            )
            course_resources.append(course_resource)
        program.learning_resource.resources.set(
            course_resources,
            through_defaults={
                "relation_type": LearningResourceRelationTypes.PROGRAM_COURSES
            },
        )

    # if not created and not program.published:

    return learning_resource


def load_programs(platform, programs_data, *, config=ProgramLoaderConfig()):
    """Load a list of programs"""
    blocklist = load_course_blocklist()
    duplicates = load_course_duplicates(platform)

    return [
        load_program(program_data, blocklist, duplicates, config=config)
        for program_data in programs_data
    ]


def load_content_file(course_run, content_file_data):
    """
    Sync a course run file/page to the database

    Args:
        course_run (LearningResourceRun): a LearningResourceRun for a Course
        content_file_data (dict): File metadata as JSON

    Returns:
        Int: the id of the object that was created or updated
    """
    try:
        content_file, _ = ContentFile.objects.update_or_create(
            run=course_run, key=content_file_data.get("key"), defaults=content_file_data
        )
        return content_file.id  # noqa: TRY300
    except:  # noqa: E722
        log.exception(
            "ERROR syncing course file %s for run %d",
            content_file_data.get("uid", ""),
            course_run.id,
        )


def load_content_files(course_run, content_files_data):
    """
    Sync all content files for a course run to database and S3 if not present in DB

    Args:
        course_run (LearningResourceRun): a course run
        content_files_data (list or generator): Details about the content files

    Returns:
        list of int: Ids of the ContentFile objects that were created/updated

    """
    if course_run.learning_resource.resource_type == LearningResourceType.course.value:
        content_files_ids = [
            load_content_file(course_run, content_file)
            for content_file in content_files_data
        ]

        deleted_files = course_run.content_files.filter(published=True).exclude(
            pk__in=content_files_ids
        )
        deleted_files.update(published=False)

        # Uncomment when search is enabled
        # if course_run.published:

        return content_files_ids
    return None


def load_video(video_data, *, config=VideoLoaderConfig()):
    """Load a video into the database"""
    readable_id = video_data.pop("readable_id")
    platform = video_data.pop("platform")
    topics_data = video_data.pop("topics", None)
    offered_bys_data = video_data.pop("offered_by", None)
    video_fields = video_data.pop("video", {})
    image_data = video_data.pop("image", None)
    with transaction.atomic():
        # lock on the video record
        (
            learning_resource,
            created,
        ) = LearningResource.objects.select_for_update().update_or_create(
            platform=LearningResourcePlatform.objects.get(platform=platform),
            readable_id=readable_id,
            resource_type=LearningResourceType.video.value,
            defaults=video_data,
        )
        video, _ = Video.objects.select_for_update().update_or_create(
            learning_resource=learning_resource, defaults=video_fields
        )
        if not topics_data:
            topics_data = extract_topics(learning_resource)
        load_image(learning_resource, image_data)
        load_topics(learning_resource, topics_data)
        load_offered_bys(learning_resource, offered_bys_data, config=config.offered_by)

    return learning_resource


def load_videos(videos_data, *, config=VideoLoaderConfig()):
    """
    Loads a list of videos data

    Args:
        videos_data (iter of dict): iterable of the video data

    Returns:
        list of Video:
            the list of loaded videos
    """  # noqa: D401
    return [load_video(video_data, config=config) for video_data in videos_data]


def load_playlist(video_channel, playlist_data, *, config=PlaylistLoaderConfig()):
    """
    Load a playlist

    Args:
        video_channel (VideoChannel): the video channel instance this playlist is under
        playlist_data (dict): the video playlist

    Returns:
        Playlist:
            the created or updated playlist
    """

    playlist_id = playlist_data.pop("playlist_id")
    videos_data = playlist_data.pop("videos", [])

    with transaction.atomic():
        playlist, _ = Playlist.objects.update_or_create(
            playlist_id=playlist_id,
            defaults={"channel": video_channel, **playlist_data},
        )

    video_resources = load_videos(videos_data, config=config.videos)

    # atomically remove existing videos in the playlist and add the current ones in bulk
    with transaction.atomic():
        for position, resource in enumerate(video_resources):
            PlaylistVideo.objects.update_or_create(
                playlist=playlist, video=resource.video, defaults={"position": position}
            )
        PlaylistVideo.objects.filter(playlist=playlist).exclude(
            video_id__in=[resource.video.id for resource in video_resources]
        ).delete()
    return playlist


def load_playlists(video_channel, playlists_data):
    """
    Load a list of channel playlists

    Args:
        video_channel (VideoChannel): the video channel instance this playlist is under
        playlists_data (iter of dict): iterable of the video playlists


    Returns:
        list of Playlist:
            the created or updated playlists
    """
    playlists = [
        load_playlist(video_channel, playlist_data) for playlist_data in playlists_data
    ]
    playlist_ids = [playlist.id for playlist in playlists]

    # remove playlists that no longer exist
    playlists_to_unpublish = Playlist.objects.filter(channel=video_channel).exclude(
        id__in=playlist_ids
    )

    playlists_to_unpublish.update(published=False)

    return playlists


def load_video_channel(video_channel_data):
    """
    Load a single video channel

    Arg:
        video_channel_data (dict):
            the normalized video channel data
    Returns:
        VideoChannel:
            the updated or created video channel
    """
    channel_id = video_channel_data.pop("channel_id")
    playlists_data = video_channel_data.pop("playlists", [])

    with transaction.atomic():
        video_channel, _ = VideoChannel.objects.select_for_update().update_or_create(
            channel_id=channel_id, defaults=video_channel_data
        )
        load_playlists(video_channel, playlists_data)

    return video_channel


def load_video_channels(video_channels_data):
    """
    Load a list of video channels

    Args:
        video_channels_data (iter of dict): iterable of the video channels data

    Returns:
        list of VideoChannel:
            list of the loaded videos
    """
    video_channels = []

    # video_channels_data is a generator
    for video_channel_data in video_channels_data:
        channel_id = video_channel_data["channel_id"]
        try:
            video_channel = load_video_channel(video_channel_data)
        except ExtractException:
            # video_channel_data has lazily evaluated generators, one of them could raise an extraction error  # noqa: E501
            # this is a small pollution of separation of concerns
            # but this allows us to stream the extracted data w/ generators
            # as opposed to having to load everything into memory, which will eventually fail  # noqa: E501
            log.exception(
                "Error with extracted video channel: channel_id=%s", channel_id
            )
        else:
            video_channels.append(video_channel)

    channel_ids = list(video_channels_data)
    VideoChannel.objects.exclude(channel_id__in=channel_ids).update(published=False)

    # finally, unpublish any published videos that aren't in at least one published playlist  # noqa: E501
    for video in (
        Video.objects.select_related("learning_resource")
        .annotate(
            in_published_playlist=Exists(
                PlaylistVideo.objects.filter(
                    video_id=OuterRef("pk"), playlist__published=True
                )
            )
        )
        .filter(learning_resource__published=True)
        .exclude(in_published_playlist=True)
    ):
        resource = video.learning_resource
        resource.published = False
        resource.save()
    return video_channels
