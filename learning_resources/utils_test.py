"""
Test learning_resources utils
"""

import json
from pathlib import Path

import pytest
import yaml

from learning_resources import utils
from learning_resources.constants import (
    CONTENT_TYPE_FILE,
    CONTENT_TYPE_PDF,
    CONTENT_TYPE_VIDEO,
    LearningResourceRelationTypes,
)
from learning_resources.etl.utils import get_content_type
from learning_resources.factories import (
    CourseFactory,
    LearningPathFactory,
    LearningResourceFactory,
    LearningResourceOfferorFactory,
    LearningResourceRunFactory,
    LearningResourceTopicFactory,
    UserListFactory,
)
from learning_resources.models import (
    LearningResource,
    LearningResourceOfferor,
    LearningResourcePlatform,
    LearningResourceTopic,
    LearningResourceTopicMapping,
)
from learning_resources.utils import (
    add_parent_topics_to_learning_resource,
    transfer_list_resources,
    upsert_topic_data_file,
    upsert_topic_data_string,
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

    with pytest.raises(LearningResource.DoesNotExist):
        fixture_resource.refresh_from_db()

    mock_plugin_manager.hook.resource_before_delete.assert_called_once_with(
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


def test_upsert_topic_data_file(mocker):
    """
    upsert_topic_data should properly process the topics yaml file, and trigger
    the topic_upserted_actions hook when it does. The upserted topics should
    have mappings where applicable and also icon names (again, if applicable).
    """

    test_file_location = "test_json/test_topics.yaml"
    mock_pluggy = mocker.patch("learning_resources.utils.topic_upserted_actions")
    # does the data_fixtures app run in test mode? not sure so clearing out topics
    LearningResourceTopic.objects.all().delete()

    # Create an OCW Offeror for mappings. The test file contains some mappings
    # for OCW, and _one_ invalid one.
    LearningResourceOfferorFactory.create(is_ocw=True)

    with Path.open(Path(test_file_location)) as topic_file:
        topic_file_yaml = topic_file.read()

    topics = yaml.safe_load(topic_file_yaml)

    def _get_topic_count(topics):
        """Walk the test OCW config file."""

        if not topics:
            return (0, 0)

        item_count = len(topics)
        mapping_count = 0

        for topic in topics:
            if topic["mappings"]:
                for offeror in topic["mappings"]:
                    for _ in topic["mappings"][offeror]:
                        mapping_count += 1

            if "children" in topic:
                (children_count, children_mapping_count) = _get_topic_count(
                    topic["children"]
                )
                item_count += children_count
                mapping_count += children_mapping_count

        return (item_count, mapping_count)

    (item_count, mapping_count) = _get_topic_count(topics["topics"])

    assert LearningResourceTopic.objects.count() == 0
    assert LearningResourceTopicMapping.objects.count() == 0

    upsert_topic_data_file(test_file_location)

    assert mock_pluggy.called
    assert LearningResourceTopic.objects.count() == item_count
    # The test file has one invalid code mapping in it - mappings have to relate
    # to a LearningResourceOfferor so we should get one less persisted mapping
    # than is in the file.
    assert LearningResourceTopicMapping.objects.count() == (mapping_count - 1)


def test_modify_topic_data_string(mocker):
    """
    Test that upserting topic data from a string also works.

    This does two things, really:
    - It tests that the upserter parses a yaml string successfully
    - It tests that modifying a topic using upserted data works
    """

    test_file_location = "test_json/test_topics.yaml"
    test_update_file_location = "test_json/test_topic_update.almost-yaml"
    # does the data_fixtures app run in test mode? not sure so clearing out topics
    LearningResourceTopic.objects.all().delete()

    # Create offerors for mappings
    LearningResourceOfferorFactory.create(is_ocw=True)
    see_offeror = LearningResourceOfferorFactory.create(is_see=True)

    upsert_topic_data_file(test_file_location)

    mock_pluggy = mocker.patch("learning_resources.utils.topic_upserted_actions")

    art_topic = LearningResourceTopic.objects.filter(
        name="Art, Design & Architecture"
    ).first()
    architecture_topic = LearningResourceTopic.objects.filter(
        name="Architecture"
    ).first()

    with Path.open(Path(test_update_file_location)) as topic_file:
        update_file_yaml = topic_file.read()

    update_yaml_string = update_file_yaml.replace(
        "%%ARCHITECTURE_ID%%", str(architecture_topic.topic_uuid)
    )

    upsert_topic_data_string(update_yaml_string)

    assert mock_pluggy.called

    assert LearningResourceTopic.objects.filter(name="Sports & Practice").count() == 1

    architecture_topic.refresh_from_db()
    art_topic.refresh_from_db()

    assert architecture_topic.icon == "RiArtboardFill"
    assert art_topic.icon == "RiArtboardLine"

    assert (
        LearningResourceTopicMapping.objects.filter(
            topic=architecture_topic, offeror=see_offeror
        ).count()
        == 1
    )


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


@pytest.mark.parametrize(
    ("matching_field", "from_source", "to_source", "matches", "delete_old"),
    [
        ("url", "podcast", "podcast", True, False),
        ("url", "podcast", "podcast", True, True),
        ("url", "podcast", "xpro", False, False),
        ("readable_id", "podcast", "podcast", False, False),
    ],
)
def test_transfer_list_resources(
    matching_field, from_source, to_source, matches, delete_old
):
    """Test that the transfer_list_resources function works as expected."""
    original_podcasts = LearningResourceFactory.create_batch(
        5, is_podcast=True, etl_source=from_source, published=False
    )
    podcast_path = LearningPathFactory.create().learning_resource
    podcast_path.resources.set(
        original_podcasts,
        through_defaults={
            "relation_type": LearningResourceRelationTypes.LEARNING_PATH_ITEMS
        },
    )
    podcast_list = UserListFactory.create()
    podcast_list.resources.set(original_podcasts)

    new_podcasts = [
        LearningResourceFactory.create(
            is_podcast=True, url=old_podcast.url, etl_source=from_source
        )
        for old_podcast in original_podcasts
    ]

    results = transfer_list_resources(
        "podcast", matching_field, from_source, to_source, delete_unpublished=delete_old
    )
    podcast_path.refresh_from_db()
    podcast_list.refresh_from_db()

    assert results == ((5, 5) if matches else (5, 0))
    list_podcasts = (
        new_podcasts if matches else (original_podcasts if not delete_old else [])
    )
    for podcast in list_podcasts:
        assert podcast in podcast_path.resources.all()
        assert podcast in podcast_list.resources.all()
    if delete_old:
        assert (
            LearningResource.objects.filter(
                id__in=[podcast.id for podcast in original_podcasts]
            ).count()
            == 0
        )
