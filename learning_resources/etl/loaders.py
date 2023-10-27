"""learning_resources data loaders"""
import json
import logging

from django.contrib.auth import get_user_model
from django.db import transaction

from learning_resources.constants import (
    LearningResourceRelationTypes,
    LearningResourceType,
    PlatformType,
)
from learning_resources.etl.constants import (
    CourseLoaderConfig,
    ProgramLoaderConfig,
)
from learning_resources.etl.deduplication import get_most_relevant_run
from learning_resources.etl.exceptions import ExtractException
from learning_resources.models import (
    ContentFile,
    Course,
    LearningResource,
    LearningResourceContentTag,
    LearningResourceDepartment,
    LearningResourceImage,
    LearningResourceInstructor,
    LearningResourceOfferor,
    LearningResourcePlatform,
    LearningResourceRun,
    LearningResourceTopic,
    Podcast,
    PodcastEpisode,
    Program,
)
from learning_resources.utils import load_course_blocklist, load_course_duplicates
from learning_resources_search import search_index_helpers

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


def load_departments(
    resource: LearningResource, department_data: list[str]
) -> list[LearningResourceDepartment]:
    """Load the departments for a resource into the database"""
    if department_data:
        departments = []

        for department_id in department_data:
            department = LearningResourceDepartment.objects.get(
                department_id=department_id
            )
            departments.append(department)
        resource.departments.set(departments)
    return resource.departments.all()


def load_instructors(
    resource: LearningResource, instructors_data: list[dict]
) -> list[LearningResourceInstructor]:
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


def load_image(resource: LearningResource, image_data: dict) -> LearningResourceImage:
    """Load the image for a resource into the database"""
    if image_data:
        image, _ = LearningResourceImage.objects.get_or_create(**image_data)

        resource.image = image
    else:
        resource.image = None
        image = None
    resource.save()
    return image


def load_offered_by(
    resource: LearningResource, offered_by_data: dict
) -> LearningResourceOfferor:
    """# noqa: D401
    Saves an offered_by to the resource.

    Args:
        resource (LearningResource): learning resource
        offered_by_data (dict): the offered by data for the resource

    Returns:
        offered_by (LearningResourceOfferor): Created or updated offered_by
    """
    if offered_by_data is None:
        resource.offered_by = None
    else:
        offered_by = LearningResourceOfferor.objects.filter(**offered_by_data).first()
        resource.offered_by = offered_by
    resource.save()
    return resource.offered_by


def load_resource_content_tags(
    resource: LearningResource, content_tags_data: list[str]
) -> list[LearningResourceContentTag]:
    """Load the content tags for a resource into the database"""
    if content_tags_data is not None:
        tags = []
        for content_tag in content_tags_data:
            tag, _ = LearningResourceContentTag.objects.get_or_create(name=content_tag)
            tags.append(tag)
        resource.resource_content_tags.set(tags)
        resource.save()
    return resource.resource_content_tags.all()


def load_run(
    learning_resource: LearningResource, run_data: dict
) -> LearningResourceRun:
    """
    Load the resource run into the database

    Args:
        learning_resource (LearningResource): the concrete parent learning resource
        run_data (dict): dictionary of data to create/update the run with

    Returns:
        LearningResourceRun: the created/updated resource run
    """
    run_id = run_data.pop("run_id")
    image_data = run_data.pop("image", None)
    instructors_data = run_data.pop("instructors", [])

    with transaction.atomic():
        (
            learning_resource_run,
            _,
        ) = LearningResourceRun.objects.select_for_update().update_or_create(
            learning_resource=learning_resource,
            run_id=run_id,
            defaults={**run_data},
        )

        load_instructors(learning_resource_run, instructors_data)
        load_image(learning_resource_run, image_data)
    return learning_resource_run


def load_course(  # noqa: C901
    resource_data: dict,
    blocklist: list[str],
    duplicates: list[dict],
    *,
    config=CourseLoaderConfig(),
) -> LearningResource:
    """
    Load the course into the database

    Args:
        resource_data (dict):
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
    platform_name = resource_data.pop("platform")
    readable_id = resource_data.pop("readable_id")
    runs_data = resource_data.pop("runs", [])
    topics_data = resource_data.pop("topics", None)
    offered_bys_data = resource_data.pop("offered_by", None)
    image_data = resource_data.pop("image", None)
    course_data = resource_data.pop("course", None)
    department_data = resource_data.pop("departments", [])
    content_tags_data = resource_data.pop("resource_content_tags", [])

    if readable_id in blocklist or not runs_data:
        resource_data["published"] = False

    deduplicated_course_id = next(
        (
            record["course_id"]
            for record in duplicates
            if readable_id in record["duplicate_course_ids"]
        ),
        None,
    )

    with transaction.atomic():
        platform = LearningResourcePlatform.objects.filter(
            platform=platform_name
        ).first()
        if not platform:
            log.exception(
                "Platform %s is null or not in database: %s",
                platform_name,
                json.dumps(readable_id),
            )
            return None

        if deduplicated_course_id:
            # intentionally not updating if the course doesn't exist
            (
                learning_resource,
                created,
            ) = LearningResource.objects.select_for_update().get_or_create(
                platform=platform,
                readable_id=deduplicated_course_id,
                resource_type=LearningResourceType.course.name,
                defaults=resource_data,
            )

            if readable_id != deduplicated_course_id:
                duplicate_resource = LearningResource.objects.filter(
                    platform=platform, readable_id=readable_id
                ).first()
                if duplicate_resource:
                    duplicate_resource.published = False
                    duplicate_resource.save()
                    search_index_helpers.deindex_course(duplicate_resource)

        else:
            (
                learning_resource,
                created,
            ) = LearningResource.objects.select_for_update().update_or_create(
                platform=platform,
                readable_id=readable_id,
                resource_type=LearningResourceType.course.name,
                defaults=resource_data,
            )

        Course.objects.get_or_create(
            learning_resource=learning_resource, defaults=course_data
        )

        run_ids_to_update_or_create = [run["run_id"] for run in runs_data]

        for course_run_data in runs_data:
            load_run(learning_resource, course_run_data)

        if deduplicated_course_id and not created:
            most_relevent_run = get_most_relevant_run(learning_resource.runs.all())

            if most_relevent_run.run_id in run_ids_to_update_or_create:
                for attr, val in resource_data.items():
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
        load_offered_by(learning_resource, offered_bys_data)
        load_image(learning_resource, image_data)
        load_departments(learning_resource, department_data)
        load_resource_content_tags(learning_resource, content_tags_data)

        if not created and not learning_resource.published:
            search_index_helpers.deindex_course(learning_resource)
        elif learning_resource.published:
            search_index_helpers.upsert_course(learning_resource.id)
    return learning_resource


def load_courses(
    etl_source: str, courses_data: list[dict], *, config=CourseLoaderConfig()
) -> list[LearningResource]:
    """
    Load a list of courses

    Args:
        etl_source (str): The ETL source of the course data
        courses_data (list of dict):
            a list of course data values
        config (CourseLoaderConfig):
            configuration on how to load this program

    Returns:
        A list of course LearningResources
    """
    blocklist = load_course_blocklist()
    duplicates = load_course_duplicates(etl_source)

    courses_list = list(courses_data or [])

    courses = [
        course
        for course in [
            load_course(course, blocklist, duplicates, config=config)
            for course in courses_list
        ]
        if course is not None
    ]

    if courses and config.prune:
        for learning_resource in LearningResource.objects.filter(
            etl_source=etl_source, resource_type=LearningResourceType.course.name
        ).exclude(id__in=[learning_resource.id for learning_resource in courses]):
            learning_resource.published = False
            learning_resource.save()
            search_index_helpers.deindex_course(learning_resource)

    return courses


def load_program(
    program_data: dict,
    blocklist: list[str],
    duplicates: list[dict],
    *,
    config=ProgramLoaderConfig(),
) -> LearningResource:
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
    offered_by_data = program_data.pop("offered_by", None)
    departments_data = program_data.pop("departments", None)
    image_data = program_data.pop("image", None)
    platform_name = program_data.pop("platform")

    course_resources = []
    with transaction.atomic():
        # lock on the program record
        platform = LearningResourcePlatform.objects.filter(
            platform=platform_name
        ).first()
        if not platform:
            log.exception(
                "Platform %s is null or not in database: %s",
                platform_name,
                json.dumps(program_data),
            )
            return None
        (
            learning_resource,
            created,  # pylint: disable=unused-variable
        ) = LearningResource.objects.select_for_update().update_or_create(
            readable_id=readable_id,
            platform=platform,
            resource_type=LearningResourceType.program.name,
            defaults=program_data,
        )

        load_topics(learning_resource, topics_data)
        load_image(learning_resource, image_data)
        load_offered_by(learning_resource, offered_by_data)
        load_departments(learning_resource, departments_data)

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
            if course_resource:
                course_resources.append(course_resource)
        program.learning_resource.resources.set(
            course_resources,
            through_defaults={
                "relation_type": LearningResourceRelationTypes.PROGRAM_COURSES
            },
        )

    if not created and not program.learning_resource.published:
        search_index_helpers.deindex_program(program.learning_resource)
    elif program.learning_resource.published:
        search_index_helpers.upsert_program(program.learning_resource.id)

    return learning_resource


def load_programs(
    etl_source: str, programs_data: list[dict], *, config=ProgramLoaderConfig()
) -> list[LearningResource]:
    """Load a list of programs"""
    blocklist = load_course_blocklist()
    duplicates = load_course_duplicates(etl_source)

    return [
        program
        for program in [
            load_program(program_data, blocklist, duplicates, config=config)
            for program_data in programs_data
        ]
        if program is not None
    ]


def load_content_file(
    course_run: LearningResourceRun, content_file_data: dict
) -> ContentFile:
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


def load_content_files(
    course_run: LearningResourceRun, content_files_data: list[dict]
) -> list[int]:
    """
    Sync all content files for a course run to database and S3 if not present in DB

    Args:
        course_run (LearningResourceRun): a course run
        content_files_data (list or generator): Details about the content files

    Returns:
        list of int: Ids of the ContentFile objects that were created/updated

    """
    if course_run.learning_resource.resource_type == LearningResourceType.course.name:
        content_files_ids = [
            load_content_file(course_run, content_file)
            for content_file in content_files_data
        ]

        deleted_files = course_run.content_files.filter(published=True).exclude(
            pk__in=content_files_ids
        )
        deleted_files.update(published=False)

        # Uncomment when contentfile search is enabled
        # if course_run.published:

        return content_files_ids
    return None


def load_podcast_episode(episode_data: dict) -> LearningResource:
    """
    Load a podcast_episode into the database
    Args:
        episode_data (dict): data for the episode
        config (PodcastLoaderConfig):
            configuration for this loader

    Returns:
        LearningResource: Podcast episode resource object that was created/updated
    """
    readable_id = episode_data.pop("readable_id")
    topics_data = episode_data.pop("topics", [])
    offered_bys_data = episode_data.pop("offered_by", {})
    image_data = episode_data.pop("image", {})
    departments_data = episode_data.pop("departments", [])

    episode_model_data = episode_data.pop("podcast_episode", {})
    with transaction.atomic():
        learning_resource, created = LearningResource.objects.update_or_create(
            readable_id=readable_id,
            platform=LearningResourcePlatform.objects.get(
                platform=PlatformType.podcast.name
            ),
            defaults=episode_data,
        )

        PodcastEpisode.objects.update_or_create(
            learning_resource=learning_resource, defaults=episode_model_data
        )
    load_image(learning_resource, image_data)
    load_topics(learning_resource, topics_data)
    load_offered_by(learning_resource, offered_bys_data)
    load_departments(learning_resource, departments_data)

    return learning_resource


def load_podcast(podcast_data: dict) -> LearningResource:
    """
    Load a single podcast

    Arg:
        podcast_data (dict):
            the normalized podcast data
        config (PodcastLoaderConfig):
            configuration for this loader
    Returns:
        LearningResource:
            the updated or created podcast resource
    """
    readable_id = podcast_data.pop("readable_id")
    episodes_data = podcast_data.pop("episodes", [])
    topics_data = podcast_data.pop("topics", [])
    offered_by_data = podcast_data.pop("offered_by", None)
    image_data = podcast_data.pop("image", {})
    podcast_model_data = podcast_data.pop("podcast", {})
    departments_data = podcast_data.pop("departments", [])

    with transaction.atomic():
        learning_resource, created = LearningResource.objects.update_or_create(
            readable_id=readable_id,
            platform=LearningResourcePlatform.objects.get(
                platform=PlatformType.podcast.name
            ),
            defaults=podcast_data,
        )
        load_image(learning_resource, image_data)
        load_topics(learning_resource, topics_data)
        load_offered_by(learning_resource, offered_by_data)
        load_departments(learning_resource, departments_data)

        Podcast.objects.update_or_create(
            learning_resource=learning_resource, defaults=podcast_model_data
        )

        episode_ids = []

        for episode_data in episodes_data:
            episode = load_podcast_episode(episode_data)
            episode_ids.append(episode.id)

        unpublished_episode_ids = (
            learning_resource.children.filter(
                relation_type=LearningResourceRelationTypes.PODCAST_EPISODES.value,
            )
            .exclude(child__id__in=episode_ids)
            .values_list("child__id", flat=True)
        )
        LearningResource.objects.filter(id__in=unpublished_episode_ids).update(
            published=False
        )
        episode_ids.extend(unpublished_episode_ids)
        learning_resource.resources.set(
            episode_ids,
            through_defaults={
                "relation_type": LearningResourceRelationTypes.PODCAST_EPISODES,
            },
        )

        return learning_resource


def load_podcasts(podcasts_data: list[dict]) -> list[LearningResource]:
    """
    Load a list of podcasts

    Args:
        podcasts_data (iter of dict): iterable of podcast data

    Returns:
        list of LearningResources:
            list of the loaded podcast resources
    """
    podcast_resources = []

    for podcast_data in podcasts_data:
        readable_id = podcast_data["readable_id"]
        try:
            podcast_resource = load_podcast(podcast_data)
        except ExtractException:
            log.exception("Error with extracted podcast: podcast_id=%s", readable_id)
        else:
            podcast_resources.append(podcast_resource)

    # unpublish the podcasts and episodes we're no longer tracking
    ids = [podcast.id for podcast in podcast_resources]
    LearningResource.objects.filter(
        resource_type=LearningResourceType.podcast.name
    ).exclude(id__in=ids).update(published=False)
    LearningResource.objects.filter(
        resource_type=LearningResourceType.podcast_episode.name
    ).exclude(parents__parent__in=ids).update(published=False)

    return podcast_resources
