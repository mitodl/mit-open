"""OpenEdx ETL tests"""

# pylint: disable=redefined-outer-name
from datetime import datetime
from decimal import Decimal
from urllib.parse import urlencode

import pytest

from learning_resources.constants import (
    Availability,
    CertificationType,
    Format,
    LearningResourceType,
    OfferedBy,
    Pace,
    PlatformType,
    RunStatus,
)
from learning_resources.etl.constants import COMMON_HEADERS, CourseNumberType
from learning_resources.etl.openedx import (
    OpenEdxConfiguration,
    _filter_resource,
    openedx_extract_transform_factory,
)
from learning_resources.factories import (
    LearningResourceFactory,
    LearningResourceOfferorFactory,
    LearningResourcePlatformFactory,
    LearningResourceRunFactory,
)
from learning_resources.serializers import LearningResourceInstructorSerializer
from main.test_utils import any_instance_of
from main.utils import clean_data

ACCESS_TOKEN = "invalid_access_token"  # noqa: S105


@pytest.fixture
def openedx_common_config():
    """Fixture for the openedx common config object"""
    return (
        "fake-client-id",
        "fake-client-secret",
        "http://localhost/fake-access-token-url/",
        "http://localhost/fake-api-url/",
        "http://localhost/fake-base-url/",
        "http://localhost/fake-alt-url/",
        "fake-platform-type",
        "fake-offered-by",
        "fake-etl-source",
    )


@pytest.fixture
def openedx_course_config(openedx_common_config):
    """Fixture for the openedx config object"""
    return OpenEdxConfiguration(
        *openedx_common_config,
        LearningResourceType.course.name,
    )


@pytest.fixture
def openedx_program_config(openedx_common_config):
    """Fixture for the openedx config object"""
    return OpenEdxConfiguration(
        *openedx_common_config,
        LearningResourceType.program.name,
    )


@pytest.fixture
def openedx_extract_transform_courses(openedx_course_config):
    """Fixture for generationg an extract/transform pair for the given config"""
    return openedx_extract_transform_factory(lambda: openedx_course_config)


@pytest.fixture
def openedx_extract_transform_programs(openedx_program_config):
    """Fixture for generationg an extract/transform pair for the given config"""
    return openedx_extract_transform_factory(lambda: openedx_program_config)


def test_extract(
    mocked_responses, openedx_course_config, openedx_extract_transform_courses
):
    """Test the generated extract functoin walks the paginated results"""
    results1 = [1, 2, 3]
    results2 = [4, 5, 6]
    next_url = "http://localhost/next/url"

    mocked_responses.add(
        mocked_responses.POST,
        openedx_course_config.access_token_url,
        json={"access_token": ACCESS_TOKEN},
    )
    mocked_responses.add(
        mocked_responses.GET,
        openedx_course_config.api_url,
        json={"results": results1, "next": next_url},
    )
    mocked_responses.add(
        mocked_responses.GET, next_url, json={"results": results2, "next": None}
    )

    assert openedx_extract_transform_courses.extract() == results1 + results2

    for call in mocked_responses.calls:
        # assert that headers contain our common ones
        assert set(COMMON_HEADERS.items()).issubset(set(call.request.headers.items()))

    assert mocked_responses.calls[0].request.body == urlencode(
        {
            "grant_type": "client_credentials",
            "client_id": openedx_course_config.client_id,
            "client_secret": openedx_course_config.client_secret,
            "token_type": "jwt",
        }
    )

    for call in mocked_responses.calls[1:]:
        assert ({("Authorization", f"JWT {ACCESS_TOKEN}")}).issubset(
            set(call.request.headers.items())
        )


@pytest.mark.usefixtures("mocked_responses")
@pytest.mark.parametrize("config_arg_idx", range(6))
def test_extract_disabled(openedx_course_config, config_arg_idx):
    """
    Verify that extract() exits with no API call if configuration is missing
    """

    args = list(openedx_course_config)
    args[config_arg_idx] = None

    config = OpenEdxConfiguration(*args)

    extract, _ = openedx_extract_transform_factory(lambda: config)

    assert extract() == []


@pytest.mark.parametrize("has_runs", [True, False])
@pytest.mark.parametrize("is_course_deleted", [True, False])
@pytest.mark.parametrize(
    ("is_run_deleted", "is_run_enrollable", "is_run_published"),
    [
        (False, False, True),
        (True, False, True),
        (False, True, True),
        (False, False, False),
    ],
)
@pytest.mark.parametrize(
    ("start_dt", "enrollment_dt", "expected_dt"),
    [
        (None, "2019-02-20T15:00:00Z", "2019-02-20T15:00:00Z"),
        ("2024-02-20T15:00:00Z", None, "2024-02-20T15:00:00Z"),
        ("2023-02-20T15:00:00Z", "2024-02-20T15:00:00Z", "2023-02-20T15:00:00Z"),
        (None, None, None),
    ],
)
def test_transform_course(  # noqa: PLR0913
    openedx_course_config,
    openedx_extract_transform_courses,
    mitx_course_data,
    has_runs,
    is_course_deleted,
    is_run_deleted,
    is_run_enrollable,
    is_run_published,
    start_dt,
    enrollment_dt,
    expected_dt,
):  # pylint: disable=too-many-arguments
    """Test that the transform function normalizes and filters out data"""
    extracted = mitx_course_data["results"]
    for course in extracted:
        if is_course_deleted:
            course["title"] = f"[delete] {course['title']}"
        if not has_runs:
            course["course_runs"] = []
        else:
            for run in course["course_runs"]:
                run["start"] = start_dt
                run["enrollment_start"] = enrollment_dt
                run["is_enrollable"] = is_run_enrollable
                run["status"] = "published" if is_run_published else "unpublished"
                if is_run_deleted:
                    run["title"] = f"[delete] {run['title']}"

    transformed_courses = openedx_extract_transform_courses.transform(extracted)
    if is_course_deleted or not has_runs:
        assert transformed_courses == []
    else:
        transformed_course = transformed_courses[0].copy()
        transformed_course.pop("availability")  # Tested separately
        assert transformed_course == {
            "title": "The Analytics Edge",
            "readable_id": "MITx+15.071x",
            "resource_type": LearningResourceType.course.name,
            "departments": ["15"],
            "description": "short_description",
            "full_description": "full description",
            "platform": openedx_course_config.platform,
            "etl_source": openedx_course_config.etl_source,
            "offered_by": {"code": openedx_course_config.offered_by},
            "image": {
                "url": "https://prod-discovery.edx-cdn.org/media/course/image/ff1df27b-3c97-42ee-a9b3-e031ffd41a4f-747c9c2f216e.small.jpg",
                "description": "Image description",
            },
            "last_modified": any_instance_of(datetime),
            "topics": [{"name": "Data Analysis & Statistics"}],
            "url": "http://localhost/fake-alt-url/this_course",
            "format": [Format.asynchronous.name],
            "pace": [Pace.instructor_paced.name]
            if has_runs
            and not is_run_deleted
            and is_run_published
            and is_run_enrollable
            else [Pace.self_paced.name],
            "published": is_run_published
            and is_run_enrollable
            and not is_run_deleted
            and has_runs,
            "certification": False,
            "certification_type": CertificationType.none.name,
            "runs": (
                []
                if is_run_deleted or not has_runs
                else [
                    {
                        "status": "Starting Soon",
                        "run_id": "course-v1:MITx+15.071x+1T2019",
                        "end_date": "2019-05-22T23:30:00Z",
                        "enrollment_end": None,
                        "enrollment_start": enrollment_dt,
                        "full_description": "<p>Full Description</p>",
                        "image": {
                            "url": "https://prod-discovery.edx-cdn.org/media/course/image/ff1df27b-3c97-42ee-a9b3-e031ffd41a4f-747c9c2f216e.small.jpg",
                            "description": None,
                        },
                        "instructors": [
                            {"first_name": "Dimitris", "last_name": "Bertsimas"},
                            {"first_name": "Allison", "last_name": "O'Hair"},
                        ],
                        "languages": ["en-us"],
                        "last_modified": any_instance_of(datetime),
                        "level": ["intermediate"],
                        "prices": ["0.00", "150.00"],
                        "semester": "Spring",
                        "description": "short_description",
                        "start_date": expected_dt,
                        "title": "The Analytics Edge",
                        "url": "http://localhost/fake-alt-url/this_course",
                        "year": 2019,
                        "published": is_run_enrollable and is_run_published,
                        "availability": Availability.dated.name,
                        "format": [Format.asynchronous.name],
                        "pace": [Pace.instructor_paced.name],
                    }
                ]
            ),
            "course": {
                "course_numbers": [
                    {
                        "value": "MITx+15.071x",
                        "department": {
                            "department_id": "15",
                            "name": "Management",
                        },
                        "listing_type": CourseNumberType.primary.value,
                        "primary": True,
                        "sort_coursenum": "MITx+15.071x",
                    }
                ]
            },
        }
        if not is_run_deleted:
            assert transformed_courses[1]["published"] is (
                is_run_enrollable and is_run_published
            )
            assert transformed_courses[1]["runs"][0]["published"] is (
                is_run_enrollable and is_run_published
            )


@pytest.mark.parametrize(
    ("run_overrides", "expected_availability"),
    [
        (
            {
                "availability": RunStatus.current.value,
                "pacing_type": "self_paced",
                "start": "2021-01-01T00:00:00Z",  # past
            },
            Availability.anytime.name,
        ),
        (
            {
                "availability": RunStatus.current.value,
                "pacing_type": "self_paced",
                "start": "2221-01-01T00:00:00Z",  # future
            },
            Availability.dated.name,
        ),
        (
            {
                "availability": RunStatus.archived.value,
            },
            Availability.anytime.name,
        ),
    ],
)
@pytest.mark.parametrize("status", ["published", "other"])
@pytest.mark.parametrize("is_enrollable", [True, False])
def test_transform_course_availability_with_single_run(  # noqa: PLR0913
    openedx_extract_transform_courses,
    mitx_course_data,
    run_overrides,
    expected_availability,
    status,
    is_enrollable,
):
    """
    Test transforming openedx courses with a single run into our course-level
    availability field.
    """
    extracted = mitx_course_data["results"]
    run = {
        **extracted[0]["course_runs"][0],
        **run_overrides,
        "is_enrollable": is_enrollable,
        "status": status,
    }
    extracted[0]["course_runs"] = [run]
    transformed_courses = openedx_extract_transform_courses.transform([extracted[0]])

    if status == "published" and is_enrollable:
        assert transformed_courses[0]["availability"] == expected_availability
    else:
        assert transformed_courses[0]["availability"] is None


@pytest.mark.parametrize("has_dated", [True, False])
def test_transform_course_availability_with_multiple_runs(
    openedx_extract_transform_courses, mitx_course_data, has_dated
):
    """
    Test that if course includes a single run corresponding to availability: "dated",
    then the overall course availability is "dated".
    """
    extracted = mitx_course_data["results"]
    run0 = {  # anytime run
        **extracted[0]["course_runs"][0],
        "availability": RunStatus.current.value,
        "pacing_type": "self_paced",
        "start": "2021-01-01T00:00:00Z",  # past
        "is_enrollable": True,
        "status": "published",
    }
    run1 = {  # anytime run
        **extracted[0]["course_runs"][0],
        "availability": RunStatus.archived.value,
        "is_enrollable": True,
        "status": "published",
    }
    run2 = {  # dated run
        **extracted[0]["course_runs"][0],
        "availability": RunStatus.current.value,
        "pacing_type": "instructor_paced",
        "start": "2221-01-01T00:00:00Z",
        "is_enrollable": True,
        "status": "published",
    }
    runs = [run0, run1]
    if has_dated:
        runs.append(run2)
    extracted[0]["course_runs"] = runs
    transformed_courses = openedx_extract_transform_courses.transform([extracted[0]])

    if has_dated:
        assert transformed_courses[0]["availability"] == Availability.dated.name
    else:
        assert transformed_courses[0]["availability"] is Availability.anytime.name


@pytest.mark.django_db
def test_transform_program(
    openedx_program_config,
    openedx_extract_transform_programs,
    mitx_programs_data,
):  # pylint: disable=too-many-arguments
    """Test that the transform function normalizes and filters out data"""
    platform = LearningResourcePlatformFactory.create(code=PlatformType.edx.name)
    offeror = LearningResourceOfferorFactory.create(code=OfferedBy.mitx.name)
    instructors = []
    topics = []
    for i in range(1, 4):
        course = LearningResourceFactory.create(
            readable_id=f"MITx+6.002.{i}x",
            platform=platform,
            offered_by=offeror,
            is_course=True,
            create_runs=False,
        )
        topics.extend([topic.name for topic in course.topics.all()])
        LearningResourceRunFactory.create(learning_resource=course)
        for run in course.runs.filter(published=True):
            instructors.extend(run.instructors.all())
    extracted = mitx_programs_data
    transformed_programs = openedx_extract_transform_programs.transform(extracted)
    transformed_program = transformed_programs[0]
    assert transformed_program == {
        "title": extracted[0]["title"],
        "readable_id": extracted[0]["uuid"],
        "resource_type": LearningResourceType.program.name,
        "description": clean_data(extracted[0]["subtitle"]),
        "full_description": clean_data(extracted[0]["subtitle"]),
        "platform": openedx_program_config.platform,
        "etl_source": openedx_program_config.etl_source,
        "offered_by": {"code": openedx_program_config.offered_by},
        "image": {
            "url": extracted[0]["banner_image"]["medium"]["url"],
            "description": extracted[0]["title"],
        },
        "last_modified": any_instance_of(datetime),
        "topics": [{"name": topic} for topic in sorted(topics)],
        "url": extracted[0]["marketing_url"],
        "published": True,
        "certification": False,
        "certification_type": CertificationType.none.name,
        "availability": Availability.anytime.name,
        "format": [Format.asynchronous.name],
        "pace": [Pace.self_paced.name],
        "runs": (
            [
                {
                    "status": RunStatus.current.value,
                    "run_id": extracted[0]["uuid"],
                    "start_date": "2019-06-20T15:00:00Z",
                    "end_date": "2025-05-26T15:00:00Z",
                    "enrollment_end": "2025-05-17T15:00:00Z",
                    "enrollment_start": None,
                    "description": extracted[0]["subtitle"],
                    "full_description": extracted[0]["subtitle"],
                    "image": {
                        "url": extracted[0]["banner_image"]["medium"]["url"],
                        "description": extracted[0]["title"],
                    },
                    "instructors": [
                        LearningResourceInstructorSerializer(instructor).data
                        for instructor in sorted(
                            instructors, key=lambda x: x.last_name or x.full_name
                        )
                    ],
                    "last_modified": any_instance_of(datetime),
                    "level": [],
                    "prices": [Decimal("567.00")],
                    "title": extracted[0]["title"],
                    "url": extracted[0]["marketing_url"],
                    "published": True,
                    "availability": Availability.anytime.name,
                    "format": [Format.asynchronous.name],
                    "pace": [Pace.self_paced.name],
                }
            ]
        ),
        "courses": [
            {
                "etl_source": openedx_program_config.etl_source,
                "offered_by": {"code": openedx_program_config.offered_by},
                "platform": openedx_program_config.platform,
                "readable_id": f"MITx+6.002.{i}x",
                "resource_type": LearningResourceType.course.name,
                "pace": [Pace.self_paced.name],
            }
            for i in range(1, 4)
        ],
    }


@pytest.mark.parametrize("deleted", [True, False])
def test_filter_resource(openedx_course_config, openedx_program_config, deleted):
    """Test that the filter_resource function filters out resources with DELETE in the title"""
    resource = {
        "title": "delete" if deleted else "Valid title",
        "course_runs": [{"run_id": "id1"}],
    }
    assert _filter_resource(openedx_course_config, resource) is not deleted
    assert _filter_resource(openedx_program_config, resource) is not deleted
