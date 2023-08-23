"""Tests for ETL loaders"""
# pylint: disable=redefined-outer-name,too-many-locals,too-many-lines
from types import SimpleNamespace

import pytest
from django.forms.models import model_to_dict

from learning_resources.etl.constants import CourseLoaderConfig, OfferedByLoaderConfig
from learning_resources.etl.loaders import (
    load_course,
    load_courses,
    load_instructors,
    load_offered_bys,
    load_program,
    load_programs,
    load_run,
    load_topics,
)
from learning_resources.etl.xpro import _parse_datetime
from learning_resources.factories import (
    CourseFactory,
    LearningResourceInstructorFactory,
    LearningResourceTopicFactory,
    LearningResourceOfferorFactory,
    LearningResourceRunFactory,
    ProgramFactory,
    LearningResourcePlatformFactory,
)
from learning_resources.models import (
    Course,
    LearningResourceRun,
    Program,
    LearningResource,
)

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def mock_blocklist(mocker):
    """Mock the load_course_blocklist function"""
    return mocker.patch(
        "learning_resources.etl.loaders.load_course_blocklist", return_value=[]
    )


@pytest.fixture(autouse=True)
def mock_duplicates(mocker):
    """Mock the load_course_duplicates function"""
    return mocker.patch(
        "learning_resources.etl.loaders.load_course_duplicates", return_value=[]
    )


@pytest.fixture(autouse=True)
def mock_upsert_tasks(mocker):
    """Mock out the upsert task helpers"""
    return SimpleNamespace(
        upsert_course=mocker.patch("search.search_index_helpers.upsert_course"),
        delete_course=mocker.patch("search.search_index_helpers.deindex_course"),
        upsert_program=mocker.patch("search.search_index_helpers.upsert_program"),
        delete_program=mocker.patch("search.search_index_helpers.deindex_program"),
        upsert_video=mocker.patch("search.search_index_helpers.upsert_video"),
        delete_video=mocker.patch("search.search_index_helpers.deindex_video"),
        delete_user_list=mocker.patch("search.search_index_helpers.deindex_user_list"),
        upsert_user_list=mocker.patch("search.search_index_helpers.upsert_user_list"),
        upsert_podcast=mocker.patch("search.search_index_helpers.upsert_podcast"),
        upsert_podcast_episode=mocker.patch(
            "search.search_index_helpers.upsert_podcast_episode"
        ),
        delete_podcast=mocker.patch("search.search_index_helpers.deindex_podcast"),
        delete_podcast_episode=mocker.patch(
            "search.search_index_helpers.deindex_podcast_episode"
        ),
        index_run_content_files=mocker.patch(
            "search.search_index_helpers.index_run_content_files"
        ),
    )


@pytest.mark.parametrize("program_exists", [True, False])
@pytest.mark.parametrize("is_published", [True, False])
@pytest.mark.parametrize("courses_exist", [True, False])
@pytest.mark.parametrize("has_retired_course", [True, False])
def test_load_program(
    # mock_upsert_tasks,
    program_exists,
    is_published,
    courses_exist,
    has_retired_course,
):  # pylint: disable=too-many-arguments
    """Test that load_program loads the program"""
    platform = LearningResourcePlatformFactory.create()

    program = (
        ProgramFactory.create(courses=[], platform=platform)
        if program_exists
        else ProgramFactory.build(courses=[], platform=platform)
    )

    LearningResourcePlatformFactory.create(platform=platform)

    if program_exists:
        learning_resource = program.learning_resource
        learning_resource.is_published = is_published
        learning_resource.platform = platform
        learning_resource.runs.set([])
        learning_resource.save()

    courses = (
        CourseFactory.create_batch(2, platform=platform)
        if courses_exist
        else CourseFactory.build_batch(2, platform=platform)
    )

    before_course_count = len(courses) if courses_exist else 0
    after_course_count = len(courses)

    if program_exists and has_retired_course:
        course = CourseFactory.create(platform=platform)
        before_course_count += 1
        after_course_count += 1
        program.learning_resource.resources.set([course.learning_resource])
        assert program.learning_resource.children.count() == 1

    assert Program.objects.count() == (1 if program_exists else 0)
    assert Course.objects.count() == before_course_count

    run_data = {
        "run_id": program.learning_resource.readable_id,
        "enrollment_start": "2017-01-01T00:00:00Z",
        "start_date": "2017-01-20T00:00:00Z",
        "end_date": "2017-06-20T00:00:00Z",
    }

    result = load_program(
        {
            "platform": platform.platform,
            "readable_id": program.learning_resource.readable_id,
            "title": program.learning_resource.title,
            "url": program.learning_resource.url,
            "image": {"url": program.learning_resource.image.url},
            "published": is_published,
            "runs": [run_data],
            "courses": [
                {
                    "readable_id": course.learning_resource.readable_id,
                    "platform": platform.platform,
                }
                for course in courses
            ],
        },
        [],
        [],
    )

    # if program_exists and not is_published:
    #    mock_upsert_tasks.delete_program.assert_called_with(result)
    # elif is_published:
    #    mock_upsert_tasks.upsert_program.assert_called_with(result.id)
    # else:
    #    mock_upsert_tasks.delete_program.assert_not_called()
    #    mock_upsert_tasks.upsert_program.assert_not_called()

    assert Program.objects.count() == 1
    assert Course.objects.count() == after_course_count

    # assert we got a program back and that each course is in a program
    assert isinstance(result, LearningResource)

    assert result.children.count() == len(courses)
    assert result.program.courses.count() == len(courses)
    assert result.runs.filter(published=True).count() == 1

    assert result.runs.filter(published=True).first().start_date == _parse_datetime(
        run_data["start_date"]
    )

    for relationship, data in zip(
        sorted(
            result.program.learning_resource.children.all(),
            key=lambda item: item.child.readable_id,
        ),
        sorted(courses, key=lambda course: course.learning_resource.readable_id),
    ):
        assert isinstance(relationship.child, LearningResource)
        assert relationship.child.readable_id == data.learning_resource.readable_id


@pytest.mark.parametrize("course_exists", [True, False])
@pytest.mark.parametrize("is_published", [True, False])
@pytest.mark.parametrize("is_run_published", [True, False])
@pytest.mark.parametrize("blocklisted", [True, False])
def test_load_course(  # pylint:disable=too-many-arguments
    # mocker,
    # mock_upsert_tasks,
    course_exists,
    is_published,
    is_run_published,
    blocklisted,
):
    """Test that load_course loads the course"""
    # mock_delete_files = mocker.patch(
    #    "learning_resources.etl.loaders.search_index_helpers.deindex_run_content_files"
    # )
    platform = LearningResourcePlatformFactory.create()

    course = (
        CourseFactory.create(runs=[], platform=platform)
        if course_exists
        else CourseFactory.build(runs=[], platform=platform)
    )

    learning_resource = course.learning_resource

    learning_resource.published = is_published

    if course_exists:
        run = LearningResourceRunFactory.create(
            learning_resource=learning_resource, published=True
        )
        learning_resource.runs.set([run])
        learning_resource.save()
    else:
        run = LearningResourceRunFactory.build()
    assert Course.objects.count() == (1 if course_exists else 0)

    props = {
        "readable_id": learning_resource.readable_id,
        "platform": platform,
        "title": learning_resource.title,
        "image": {"url": learning_resource.image.url},
        "description": learning_resource.description,
        "url": learning_resource.url,
        "published": is_published,
    }

    if is_run_published:
        run = {
            "run_id": run.run_id,
            "enrollment_start": run.enrollment_start,
            "start_date": run.start_date,
            "end_date": run.end_date,
        }
        props["runs"] = [run]
    else:
        props["runs"] = []

    blocklist = [learning_resource.readable_id] if blocklisted else []

    result = load_course(props, blocklist, [], config=CourseLoaderConfig(prune=True))

    # if course_exists and (not is_published or not is_run_published) and not blocklisted:
    #    mock_upsert_tasks.delete_course.assert_called_with(result)
    # elif is_published and is_run_published and not blocklisted:
    #    mock_upsert_tasks.upsert_course.assert_called_with(result.id)
    # else:
    #    mock_upsert_tasks.delete_program.assert_not_called()
    #    mock_upsert_tasks.upsert_course.assert_not_called()
    if course_exists and is_published and not blocklisted:
        course.refresh_from_db()
        assert course.learning_resource.runs.last().published is is_run_published
        assert course.learning_resource.published == (is_published and is_run_published)
        # assert mock_delete_files.call_count == (1 if course.published else 0)

    assert Course.objects.count() == 1
    assert LearningResourceRun.objects.filter(published=True).count() == (
        1 if is_run_published else 0
    )

    # assert we got a course back
    assert isinstance(result, LearningResource)

    for key, value in props.items():
        assert getattr(result, key) == value, f"Property {key} should equal {value}"


@pytest.mark.parametrize("course_exists", [True, False])
@pytest.mark.parametrize("course_id_is_duplicate", [True, False])
@pytest.mark.parametrize("duplicate_course_exists", [True, False])
def test_load_duplicate_course(
    # mock_upsert_tasks,
    course_exists,
    course_id_is_duplicate,
    duplicate_course_exists,
):
    """Test that load_course loads the course"""
    platform = LearningResourcePlatformFactory.create()

    course = (
        CourseFactory.create(runs=[], platform=platform)
        if course_exists
        else CourseFactory.build()
    )

    duplicate_course = (
        CourseFactory.create(runs=[], platform=platform)
        if duplicate_course_exists
        else CourseFactory.build()
    )

    if course_exists and duplicate_course_exists:
        assert Course.objects.count() == 2
    elif course_exists or duplicate_course_exists:
        assert Course.objects.count() == 1
    else:
        assert Course.objects.count() == 0

    duplicates = [
        {
            "course_id": course.learning_resource.readable_id,
            "duplicate_course_ids": [
                course.learning_resource.readable_id,
                duplicate_course.learning_resource.readable_id,
            ],
        }
    ]

    course_id = (
        duplicate_course.learning_resource.readable_id
        if course_id_is_duplicate
        else course.learning_resource.readable_id
    )

    props = {
        "readable_id": course_id,
        "platform": platform.platform,
        "title": "New title",
        "description": "something",
        "runs": [
            {
                "run_id": course.learning_resource.readable_id,
                "enrollment_start": "2017-01-01T00:00:00Z",
                "start_date": "2017-01-20T00:00:00Z",
                "end_date": "2017-06-20T00:00:00Z",
            }
        ],
    }

    result = load_course(props, [], duplicates)

    # if course_id_is_duplicate and duplicate_course_exists:
    #    mock_upsert_tasks.delete_course.assert_called()

    # mock_upsert_tasks.upsert_course.assert_called_with(result.id)

    assert Course.objects.count() == (2 if duplicate_course_exists else 1)

    assert isinstance(result, LearningResource)

    saved_course = LearningResource.objects.filter(
        readable_id=course.learning_resource.readable_id
    ).first()

    for key, value in props.items():
        assert getattr(result, key) == value, f"Property {key} should equal {value}"
        assert (
            getattr(saved_course, key) == value
        ), f"Property {key} should be updated to {value} in the database"


@pytest.mark.parametrize("run_exists", [True, False])
def test_load_run(run_exists):
    """Test that load_run loads the course run"""
    # mock_load_content_files = mocker.patch(
    #    "learning_resources.etl.loaders.load_content_files"
    # )
    course = CourseFactory.create(runs=[])
    learning_resource_run = (
        LearningResourceRunFactory.create(learning_resource=course.learning_resource)
        if run_exists
        else LearningResourceRunFactory.build()
    )
    props = model_to_dict(
        LearningResourceRunFactory.build(run_id=learning_resource_run.run_id)
    )

    del props["id"]
    del props["learning_resource"]

    assert LearningResourceRun.objects.count() == (1 if run_exists else 0)

    result = load_run(course.learning_resource, props)

    assert LearningResourceRun.objects.count() == 1

    assert result.learning_resource == course.learning_resource

    assert isinstance(result, LearningResourceRun)

    # assert mock_load_content_files.call_count == (1 if load_content else 0)

    for key, value in props.items():
        assert getattr(result, key) == value, f"Property {key} should equal {value}"


@pytest.mark.parametrize("parent_factory", [CourseFactory, ProgramFactory])
@pytest.mark.parametrize("topics_exist", [True, False])
def test_load_topics(parent_factory, topics_exist):
    """Test that load_topics creates and/or assigns topics to the parent object"""
    topics = (
        LearningResourceTopicFactory.create_batch(3)
        if topics_exist
        else LearningResourceTopicFactory.build_batch(3)
    )
    parent = parent_factory.create()

    load_topics(parent.learning_resource, [])

    assert parent.learning_resource.topics.count() == 0

    load_topics(parent.learning_resource, [{"name": topic.name} for topic in topics])

    assert parent.learning_resource.topics.count() == len(topics)

    load_topics(parent.learning_resource, None)

    assert parent.learning_resource.topics.count() == len(topics)

    load_topics(parent.learning_resource, [])

    assert parent.learning_resource.topics.count() == 0


@pytest.mark.parametrize("instructor_exists", [True, False])
def test_load_instructors(instructor_exists):
    """Test that load_instructors creates and/or assigns instructors to the course run"""
    instructors = (
        LearningResourceInstructorFactory.create_batch(3)
        if instructor_exists
        else LearningResourceInstructorFactory.build_batch(3)
    )
    run = LearningResourceRunFactory.create(no_instructors=True)

    assert run.instructors.count() == 0

    load_instructors(
        run, [{"full_name": instructor.full_name} for instructor in instructors]
    )

    assert run.instructors.count() == len(instructors)


@pytest.mark.parametrize("parent_factory", [CourseFactory, ProgramFactory])
@pytest.mark.parametrize("offeror_exists", [True, False])
@pytest.mark.parametrize("has_other_offered_by", [True, False])
@pytest.mark.parametrize("additive", [True, False])
@pytest.mark.parametrize("null_data", [True, False])
def test_load_offered_bys(
    parent_factory, offeror_exists, has_other_offered_by, additive, null_data
):
    """Test that load_offered_bys creates and/or assigns offeror to the parent object"""
    xpro_offeror = (
        LearningResourceOfferorFactory.create(is_xpro=True)
        if offeror_exists
        else LearningResourceOfferorFactory.build(is_xpro=True)
    )
    mitx_offeror = LearningResourceOfferorFactory.create(is_mitx=True)
    parent = parent_factory.create()

    expected = []

    if not null_data:
        expected.append(xpro_offeror.name)

    if has_other_offered_by and (additive or null_data):
        expected.append(mitx_offeror.name)

    if has_other_offered_by:
        parent.learning_resource.offered_by.set([mitx_offeror])
    else:
        parent.learning_resource.offered_by.set([])

    assert parent.learning_resource.offered_by.count() == (
        1 if has_other_offered_by else 0
    )

    load_offered_bys(
        parent.learning_resource,
        None if null_data else [{"name": xpro_offeror.name}],
        config=OfferedByLoaderConfig(additive=additive),
    )

    assert set(
        parent.learning_resource.offered_by.values_list("name", flat=True)
    ) == set(expected)


@pytest.mark.parametrize("prune", [True, False])
def test_load_courses(mocker, mock_blocklist, mock_duplicates, prune):
    """Test that load_courses calls the expected functions"""
    platform = LearningResourcePlatformFactory.create()

    course_to_unpublish = CourseFactory.create(platform=platform)
    courses = CourseFactory.create_batch(3, platform=platform)

    courses_data = [
        {"readable_id": course.learning_resource.readable_id} for course in courses
    ]
    mock_load_course = mocker.patch(
        "learning_resources.etl.loaders.load_course",
        autospec=True,
        side_effect=[course.learning_resource for course in courses],
    )
    config = CourseLoaderConfig(prune=prune)
    load_courses(
        course_to_unpublish.learning_resource.platform, courses_data, config=config
    )
    assert mock_load_course.call_count == len(courses)
    for course_data in courses_data:
        mock_load_course.assert_any_call(
            course_data,
            mock_blocklist.return_value,
            mock_duplicates.return_value,
            config=config,
        )
    mock_blocklist.assert_called_once_with()
    mock_duplicates.assert_called_once_with(platform)
    course_to_unpublish.refresh_from_db()
    assert course_to_unpublish.learning_resource.published is not prune


def test_load_programs(mocker, mock_blocklist, mock_duplicates):
    """Test that load_programs calls the expected functions"""
    program_data = [{"courses": [{"platform": "a"}, {}]}]
    mock_load_program = mocker.patch(
        "learning_resources.etl.loaders.load_program", autospec=True
    )
    load_programs("mitx", program_data)
    assert mock_load_program.call_count == len(program_data)
    mock_blocklist.assert_called_once()
    mock_duplicates.assert_called_once_with("mitx")
