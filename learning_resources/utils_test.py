"""
Test learning_resources utils
"""

import json
from pathlib import Path

import pytest

from learning_resources import utils
from learning_resources.constants import (
    CONTENT_TYPE_FILE,
    CONTENT_TYPE_PDF,
    CONTENT_TYPE_VIDEO,
)
from learning_resources.etl.utils import get_content_type
from learning_resources.factories import (
    CourseFactory,
    LearningResourceRunFactory,
    LearningResourceTopicFactory,
)
from learning_resources.models import (
    LearningResourceOfferor,
    LearningResourcePlatform,
    LearningResourceTopic,
)
from learning_resources.utils import (
    add_parent_topics_to_learning_resource,
    upsert_topic_data,
)

pytestmark = pytest.mark.django_db


@pytest.fixture()
def mock_plugin_manager(mocker):
    """Fixture for mocking the plugin manager"""
    return mocker.patch("learning_resources.utils.get_plugin_manager").return_value


@pytest.fixture()
def fixture_resource(mocker):
    """Fixture for returning a learning resource of resource_type course"""
    return CourseFactory.create().learning_resource


@pytest.fixture()
def fixture_resource_run(mocker):
    """Fixture for returning a learning resource run"""
    return LearningResourceRunFactory.create()


@pytest.fixture(name="test_instructors_data")
def fixture_test_instructors_data():
    """
    Test instructors data
    """
    with open("./test_json/test_instructors_data.json") as test_data:  # noqa: PTH123
        return json.load(test_data)["instructors"]


@pytest.mark.parametrize("url", [None, "http://test.me"])
def test_load_blocklist(url, settings, mocker):
    """Test that a list of course ids is returned if a URL is set"""
    settings.BLOCKLISTED_COURSES_URL = url
    file_content = [b"MITX_Test1_FAKE", b"MITX_Test2_Fake", b"OCW_Test_Fake"]
    mock_request = mocker.patch(
        "requests.get",
        autospec=True,
        return_value=mocker.Mock(iter_lines=mocker.Mock(return_value=file_content)),
    )
    blocklist = utils.load_course_blocklist()
    if url is None:
        mock_request.assert_not_called()
        assert blocklist == []
    else:
        mock_request.assert_called_once_with(url, timeout=settings.REQUESTS_TIMEOUT)
        assert blocklist == [str(id, "utf-8") for id in file_content]  # noqa: A001


@pytest.mark.parametrize("url", [None, "http://test.me"])
@pytest.mark.parametrize("etl_source", ["mitx", "other"])
def test_load_course_duplicates(url, etl_source, settings, mocker):
    """Test that a list of duplicate course id sets is returned if a URL is set"""
    settings.DUPLICATE_COURSES_URL = url
    file_content = """
---
mitx:
  - duplicate_course_ids:
      - MITx+1
      - MITx+2
      - MITx+3
    course_id: MITx+1
"""

    mock_request = mocker.patch(
        "requests.get", autospec=True, return_value=mocker.Mock(text=file_content)
    )
    duplicates = utils.load_course_duplicates(etl_source)
    if url is None:
        mock_request.assert_not_called()
        assert duplicates == []
    elif etl_source == "other":
        mock_request.assert_called_once_with(url, timeout=settings.REQUESTS_TIMEOUT)
        assert duplicates == []
    else:
        mock_request.assert_called_once_with(url, timeout=settings.REQUESTS_TIMEOUT)
        assert duplicates == [
            {
                "duplicate_course_ids": ["MITx+1", "MITx+2", "MITx+3"],
                "course_id": "MITx+1",
            }
        ]


def test_safe_load_bad_json(mocker):
    """Test that safe_load_json returns an empty dict for invalid JSON"""
    mock_logger = mocker.patch("learning_resources.utils.log.exception")
    assert utils.safe_load_json("badjson", "key") == {}
    mock_logger.assert_called_with("%s has a corrupted JSON", "key")


def test_parse_instructors(test_instructors_data):
    """
    Verify that instructors assignment is working as expected
    """
    for instructor in test_instructors_data:
        parsed_instructors = utils.parse_instructors([instructor["data"]])
        parsed_instructor = parsed_instructors[0]
        assert parsed_instructor.get("first_name") == instructor["result"]["first_name"]
        assert parsed_instructor.get("last_name") == instructor["result"]["last_name"]
        assert parsed_instructor.get("full_name") == instructor["result"]["full_name"]


def test_get_ocw_topics():
    """get_ocw_topics should return the expected list of topics"""
    collection = [
        {
            "ocw_feature": "Engineering",
            "ocw_subfeature": "Mechanical Engineering",
            "ocw_speciality": "Dynamics and Control",
        },
        {
            "ocw_feature": "Engineering",
            "ocw_subfeature": "Electrical Engineering",
            "ocw_speciality": "Signal Processing",
        },
    ]

    assert sorted(utils.get_ocw_topics(collection)) == [
        "Dynamics and Control",
        "Electrical Engineering",
        "Engineering",
        "Mechanical Engineering",
        "Signal Processing",
    ]


@pytest.mark.parametrize(
    ("file_type", "output"),
    [
        ("video/mp4", CONTENT_TYPE_VIDEO),
        ("application/pdf", CONTENT_TYPE_PDF),
        ("application/zip", CONTENT_TYPE_FILE),
        (None, CONTENT_TYPE_FILE),
    ],
)
def test_get_content_type(file_type, output):
    """
    get_content_type should return expected value
    """
    assert get_content_type(file_type) == output


@pytest.mark.django_db()
def test_platform_data():
    """
    Test that the platform data is upserted correctly
    """
    LearningResourcePlatform.objects.create(code="bad", name="bad platform")
    assert LearningResourcePlatform.objects.filter(code="bad").count() == 1
    with Path.open(Path(__file__).parent / "fixtures" / "platforms.json") as inf:
        expected_count = len(json.load(inf))
    codes = utils.upsert_platform_data()
    assert LearningResourcePlatform.objects.count() == expected_count == len(codes)
    assert LearningResourcePlatform.objects.filter(code="bad").count() == 0


def test_resource_upserted_actions(mock_plugin_manager, fixture_resource):
    """
    resource_upserted_actions function should trigger plugin hook's resource_upserted function
    """
    utils.resource_upserted_actions(fixture_resource, percolate=False)
    mock_plugin_manager.hook.resource_upserted.assert_called_once_with(
        resource=fixture_resource, percolate=False
    )


def test_similar_topics_action(mock_plugin_manager, fixture_resource) -> dict:
    """
    similar_topics_action should trigger plugin hook's resource_similar_topics function
    """
    mock_topics = [{"name": "Biology"}, {"name": "Chemistry"}]
    mock_plugin_manager.hook.resource_similar_topics.return_value = [mock_topics]
    assert utils.similar_topics_action(fixture_resource) == mock_topics
    mock_plugin_manager.hook.resource_similar_topics.assert_called_once_with(
        resource=fixture_resource
    )


def test_resource_unpublished_actions(mock_plugin_manager, fixture_resource):
    """
    resource_unpublished_actions function should trigger plugin hook's resource_unpublished function
    """
    utils.resource_unpublished_actions(fixture_resource)
    mock_plugin_manager.hook.resource_unpublished.assert_called_once_with(
        resource=fixture_resource
    )


def test_resource_delete_actions(mock_plugin_manager, fixture_resource):
    """
    resource_delete_actions function should trigger plugin hook's resource_deleted function
    """
    utils.resource_delete_actions(fixture_resource)
    mock_plugin_manager.hook.resource_delete.assert_called_once_with(
        resource=fixture_resource
    )


def test_resource_run_upserted_actions(mock_plugin_manager, fixture_resource_run):
    """
    resource_run_upserted_actions function should trigger plugin hook's resource_run_upserted function
    """
    utils.resource_run_upserted_actions(fixture_resource_run)
    mock_plugin_manager.hook.resource_run_upserted.assert_called_once_with(
        run=fixture_resource_run
    )


def test_resource_run_unpublished_actions(mock_plugin_manager, fixture_resource_run):
    """
    resource_run_unpublished_actions function should trigger plugin hook's resource_run_unpublished function
    """
    utils.resource_run_unpublished_actions(fixture_resource_run)
    mock_plugin_manager.hook.resource_run_unpublished.assert_called_once_with(
        run=fixture_resource_run
    )


def test_resource_run_delete_actions(mock_plugin_manager, fixture_resource_run):
    """
    resource_run_delete_actions function should trigger plugin hook's resource_run_deleted function
    """
    utils.resource_run_delete_actions(fixture_resource_run)
    mock_plugin_manager.hook.resource_run_delete.assert_called_once_with(
        run=fixture_resource_run
    )


def test_upsert_topic_data(mocker):
    """
    upsert_topic_data should properly process the OCW JSON file, and trigger the
    topic_upserted_actions hook when it does.
    """

    test_file_location = "test_json/ocw-course-site-config.json"
    mock_pluggy = mocker.patch("learning_resources.utils.topic_upserted_actions")

    with Path.open(Path(test_file_location)) as ocw_config:
        ocw_config_json = ocw_config.read()

    ocw_config = json.loads(ocw_config_json)["collections"][0]["files"][0]["fields"][0][
        "options_map"
    ]

    def _walk_ocw_config(config_point):
        """Walk the test OCW config file."""

        item_count = len(config_point)

        for item in config_point:
            if isinstance(item, dict):
                item_count += _walk_ocw_config(item)

        return item_count

    item_count = _walk_ocw_config(ocw_config)

    assert LearningResourceTopic.objects.count() == 0

    upsert_topic_data(test_file_location)

    assert mock_pluggy.called
    assert LearningResourceTopic.objects.count() > item_count


def test_add_parent_topics_to_learning_resource(fixture_resource):
    """Ensure the parent topics get added to the resource."""

    main_topic = LearningResourceTopicFactory.create()
    sub_topic = LearningResourceTopicFactory.create(parent=main_topic)

    fixture_resource.topics.add(sub_topic)
    fixture_resource.save()

    add_parent_topics_to_learning_resource(fixture_resource)

    fixture_resource.refresh_from_db()

    assert fixture_resource.topics.filter(pk=main_topic.id).exists()


def test_upsert_offered_by(mocker):
    """Test that upsert_offered_by_data creates expected offerors and triggers pluggy"""
    mock_upsert = mocker.patch("learning_resources.utils.offeror_upserted_actions")
    with Path.open(Path(__file__).parent / "fixtures" / "offered_by.json") as inf:
        offered_by_json = json.load(inf)
    utils.upsert_offered_by_data()
    assert LearningResourceOfferor.objects.count() == len(offered_by_json)
    for offered_by_data in offered_by_json:
        offeror = LearningResourceOfferor.objects.get(
            code=offered_by_data["fields"]["code"]
        )
        assert offeror.name == offered_by_data["fields"]["name"]
        mock_upsert.assert_any_call(offeror, overwrite=True)
