"""ETL utils test"""

import datetime
import pathlib
from random import randrange
from subprocess import check_call
from tempfile import TemporaryDirectory
from unittest.mock import ANY

import pytest
from lxml import etree

from learning_resources.constants import (
    CONTENT_TYPE_FILE,
    CONTENT_TYPE_VERTICAL,
    AvailabilityType,
    LearningResourceFormat,
    LearningResourceType,
    OfferedBy,
    PlatformType,
)
from learning_resources.etl import utils
from learning_resources.etl.utils import parse_certification
from learning_resources.factories import (
    ContentFileFactory,
    LearningResourceFactory,
    LearningResourceOfferorFactory,
    LearningResourceRunFactory,
    LearningResourceTopicFactory,
)
from learning_resources.serializers import LearningResourceSerializer

pytestmark = pytest.mark.django_db


def get_olx_test_docs():
    """Get a list of edx docs from a sample archive file"""
    script_dir = pathlib.Path(__file__).parent.absolute().parent.parent
    with TemporaryDirectory() as temp:
        check_call(
            [  # noqa: S603,S607
                "tar",
                "xf",
                pathlib.Path(script_dir, "test_json", "exported_courses_12345.tar.gz"),
            ],
            cwd=temp,
        )
        check_call(
            ["tar", "xf", "content-devops-0001.tar.gz"],  # noqa: S603,S607
            cwd=temp,
        )

        olx_path = pathlib.Path(temp, "content-devops-0001")
        return list(utils.documents_from_olx(str(olx_path)))


@pytest.mark.parametrize("has_bucket", [True, False])
@pytest.mark.parametrize("metadata", [None, {"foo": "bar"}])
def test_sync_s3_text(mock_ocw_learning_bucket, has_bucket, metadata):
    """
    Verify data is saved to S3 if a bucket and metadata are provided
    """
    key = "fake_key"
    utils.sync_s3_text(
        mock_ocw_learning_bucket.bucket if has_bucket else None, key, metadata
    )
    s3_objects = list(
        mock_ocw_learning_bucket.bucket.objects.filter(Prefix=f"extracts/{key}")
    )
    assert len(s3_objects) == (1 if has_bucket and metadata is not None else 0)


@pytest.mark.parametrize("token", ["abc123", "", None])
@pytest.mark.parametrize("ocr_strategy", ["no_ocr", "ocr_and_text_extraction", None])
@pytest.mark.parametrize("data", [b"data", b"", None])
@pytest.mark.parametrize("headers", [None, {"a": "header"}])
def test_extract_text_metadata(  # noqa: PLR0913
    mocker, settings, data, token, ocr_strategy, headers
):
    """
    Verify that tika is called and returns a response
    """
    settings.TIKA_TIMEOUT = 120
    settings.TIKA_ACCESS_TOKEN = token
    settings.TIKA_OCR_STRATEGY = ocr_strategy
    mock_response = {"metadata": {"Author:": "MIT"}, "content": "Extracted text"}
    mock_tika = mocker.patch(
        "learning_resources.etl.utils.tika_parser.from_buffer",
        return_value=mock_response,
    )
    response = utils.extract_text_metadata(data, other_headers=headers)

    expected_headers = {"X-Tika-PDFOcrStrategy": ocr_strategy} if ocr_strategy else {}
    expected_options = {"timeout": 120, "verify": True}

    if token:
        expected_headers["X-Access-Token"] = token
    if headers:
        expected_headers = {**expected_headers, **headers}
    expected_options["headers"] = expected_headers

    if data:
        assert response == mock_response
        mock_tika.assert_called_once_with(data, requestOptions=expected_options)
    else:
        assert response is None
        mock_tika.assert_not_called()


@pytest.mark.parametrize("content", ["text", None])
def test_extract_text_from_url(mocker, content):
    """extract_text_from_url should make appropriate requests and calls to extract_text_metadata"""
    mime_type = "application/pdf"
    url = "http://test.edu/file.pdf"
    mock_request = mocker.patch(
        "learning_resources.etl.utils.requests.get",
        return_value=mocker.Mock(content=content),
    )
    mock_extract = mocker.patch("learning_resources.etl.utils.extract_text_metadata")
    utils.extract_text_from_url(url, mime_type=mime_type)

    mock_request.assert_called_once_with(url, timeout=30)
    if content:
        mock_extract.assert_called_once_with(
            content, other_headers={"Content-Type": mime_type}
        )


@pytest.mark.parametrize(
    ("text", "readable_id"),
    [
        (
            "The cat sat on the mat",
            "the-cat-sat-on-the-mat65e998f1508038ccb0e8afbb2fe10b7b",
        ),
        (
            "the dog chased a hog",
            "the-dog-chased-a-hog0adcc86118883d4b8bf121c4a0e036d6",
        ),
    ],
)
def test_generate_readable_id(text, readable_id):
    """Test that the same readable_id is always created for a given string"""
    assert utils.generate_readable_id(text) == readable_id


def test_strip_extra_whitespace():
    """Test that extra whitespace is removed from text"""
    text = " This\n\n is      a\t\ttest. "
    assert utils.strip_extra_whitespace(text) == "This is a test."


def test_parse_dates():
    """Test that parse_dates returns correct dates"""
    for datestring in ("May 13-30, 2020", "May 13 - 30,2020"):
        assert utils.parse_dates(datestring) == (
            datetime.datetime(2020, 5, 13, 12, tzinfo=datetime.UTC),
            datetime.datetime(2020, 5, 30, 12, tzinfo=datetime.UTC),
        )
    for datestring in ("Jun 24-Aug 11, 2020", "Jun  24 -  Aug 11,    2020"):
        assert utils.parse_dates(datestring) == (
            datetime.datetime(2020, 6, 24, 12, tzinfo=datetime.UTC),
            datetime.datetime(2020, 8, 11, 12, tzinfo=datetime.UTC),
        )
    for datestring in ("Nov 25, 2020-Jan 26, 2021", "Nov 25,2020  -Jan   26,2021"):
        assert utils.parse_dates(datestring) == (
            datetime.datetime(2020, 11, 25, 12, tzinfo=datetime.UTC),
            datetime.datetime(2021, 1, 26, 12, tzinfo=datetime.UTC),
        )
    assert utils.parse_dates("This is not a date") is None


def test_get_text_from_element():
    """
    get_text_from_element should walk through elements, extracting text, and ignoring script and style tags completely.
    """
    input_xml = """
    <vertical display_name="name">
    pre-text
    <style attr="ibute">
    style stuff here
    </style>
    <script>
    scripty script
    </script>
    <other>
    some
    <inner>
    important
    </inner>
    text here
    </other>
    post-text
    </vertical>
    """

    ret = utils.get_text_from_element(etree.fromstring(input_xml))  # noqa: S320
    assert (
        ret == "\n    pre-text\n     \n    some\n     \n    important"
        "\n     \n    text here\n     \n    post-text\n    "
    )


@pytest.mark.parametrize("has_metadata", [True, False])
@pytest.mark.parametrize("matching_checksum", [True, False])
def test_transform_content_files(mocker, has_metadata, matching_checksum):
    """transform_content_files"""
    run = LearningResourceRunFactory.create(published=True)
    document = "some text in the document"
    key = "a key here"
    content_type = "course"
    checksum = "7s35721d1647f962d59b8120a52210a7"
    metadata = (
        {"Author": "author", "language": "French", "title": "the title of the course"}
        if has_metadata
        else None
    )
    tika_output = {"content": "tika'ed text", "metadata": metadata}
    if matching_checksum:
        ContentFileFactory.create(
            content=tika_output["content"],
            content_author=metadata["Author"] if metadata else "",
            content_title=metadata["title"] if metadata else "",
            content_language=metadata["language"] if metadata else "",
            content_type=content_type,
            published=True,
            run=run,
            checksum=checksum,
            key=key,
        )

    documents_mock = mocker.patch(
        "learning_resources.etl.utils.documents_from_olx",
        return_value=[
            (document, {"key": key, "content_type": content_type, "checksum": checksum})
        ],
    )
    extract_mock = mocker.patch(
        "learning_resources.etl.utils.extract_text_metadata", return_value=tika_output
    )

    script_dir = (pathlib.Path(__file__).parent.absolute()).parent.parent

    content = list(
        utils.transform_content_files(
            pathlib.Path(script_dir, "test_json", "exported_courses_12345.tar.gz"), run
        )
    )
    assert content == [
        {
            "content": tika_output["content"],
            "key": key,
            "published": True,
            "content_author": metadata["Author"] if has_metadata else "",
            "content_title": metadata["title"] if has_metadata else "",
            "content_language": metadata["language"] if has_metadata else "",
            "content_type": content_type,
            "checksum": checksum,
        }
    ]
    if matching_checksum:
        extract_mock.assert_not_called()
    else:
        extract_mock.assert_called_once_with(document, other_headers={})
    assert documents_mock.called is True


def test_documents_from_olx():
    """Test for documents_from_olx"""
    parsed_documents = get_olx_test_docs()
    assert len(parsed_documents) == 108

    expected_parsed_vertical = (
        "\n    Where all of the tests are defined  Jasmine tests: HTML module edition"
        " \n Did it break? Dunno; let's find out. \n Some of the libraries tested are"
        " only served by the LMS for courseware, therefore, some tests can be expected"
        " to fail if executed in Studio. \n\n  Where Jasmine will inject its output"
        " (dictated in boot.js)  \n Test output will generate here when viewing in LMS."
    )
    assert parsed_documents[0] == (
        expected_parsed_vertical,
        {
            "key": "vertical_1",
            "title": "HTML",
            "content_type": CONTENT_TYPE_VERTICAL,
            "mime_type": "application/xml",
            "checksum": "2c35721d1647f962d59b8120a52210a7",
        },
    )
    formula2do = next(
        doc for doc in parsed_documents if doc[1]["key"].endswith("formula2do.xml")
    )
    assert formula2do[0] == b'<html filename="formula2do" display_name="To do list"/>\n'
    assert formula2do[1]["key"].endswith("formula2do.xml")
    assert formula2do[1]["content_type"] == CONTENT_TYPE_FILE
    assert formula2do[1]["mime_type"].endswith("/xml")


def test_documents_from_olx_bad_vertical(mocker):
    """An exception should be logged if verticals can't be read, other files should still be processed"""
    mock_log = mocker.patch("learning_resources.etl.utils.log.exception")
    mock_bundle = mocker.patch("learning_resources.etl.utils.XBundle")
    mock_bundle.return_value.import_from_directory.side_effect = OSError()
    parsed_documents = get_olx_test_docs()
    mock_log.assert_called_once_with("Could not read verticals from path %s", ANY)
    assert len(parsed_documents) == 92


@pytest.mark.parametrize(
    "platform", [PlatformType.mitxonline.name, PlatformType.xpro.name]
)
def test_get_learning_course_bucket(
    aws_settings, mock_mitx_learning_bucket, mock_xpro_learning_bucket, platform
):  # pylint: disable=unused-argument
    """The correct bucket should be returned by the function"""
    assert utils.get_learning_course_bucket(platform).name == (
        aws_settings.MITX_ONLINE_LEARNING_COURSE_BUCKET_NAME
        if platform == PlatformType.mitxonline.name
        else aws_settings.XPRO_LEARNING_COURSE_BUCKET_NAME
    )


@pytest.mark.parametrize(
    ("readable_id", "is_ocw", "dept_ids"),
    [
        ("MITx+7.03.2x", False, ["7"]),
        ("course-v1:MITxT+21A.819.2x", False, ["21A"]),
        ("11.343", True, ["11"]),
        ("21W.202", True, ["CMS-W"]),
        ("21H.331", True, ["21H"]),
        ("course-v1:MITxT+123.658.2x", False, []),
        ("MITx+CITE101x", False, []),
        ("RanD0mStr1ng", False, []),
    ],
)
def test_extract_valid_department_from_id(readable_id, is_ocw, dept_ids):
    """Test that correct department is extracted from ID"""
    assert (
        utils.extract_valid_department_from_id(readable_id, is_ocw=is_ocw) == dept_ids
    )


def test_most_common_topics():
    """Test that most_common_topics returns the correct topics"""
    max_topics = 4
    common_topics = LearningResourceTopicFactory.create_batch(max_topics)
    uncommon_topics = LearningResourceTopicFactory.create_batch(3)
    resources = []
    for topic in common_topics:
        resources.extend(
            LearningResourceFactory.create_batch(randrange(2, 4), topics=[topic])  # noqa: S311
        )
    resources.extend(
        [LearningResourceFactory.create(topics=[topic]) for topic in uncommon_topics]
    )
    assert sorted(
        [
            topic["name"]
            for topic in utils.most_common_topics(resources, max_topics=max_topics)
        ]
    ) == [topic.name for topic in common_topics]


@pytest.mark.parametrize(
    ("original", "expected"),
    [
        (None, LearningResourceFormat.online.name),
        (LearningResourceFormat.online.value, LearningResourceFormat.online.name),
        ("Blended", LearningResourceFormat.hybrid.name),
        ("In person", LearningResourceFormat.in_person.name),
    ],
)
def test_parse_format(original, expected):
    """parse_format should return expected format"""
    assert utils.transform_format(original) == [expected]


def test_parse_bad_format(mocker):
    """An exception log should be called for invalid formats"""
    mock_log = mocker.patch("learning_resources.etl.utils.log.exception")
    assert utils.transform_format("bad_format") == [LearningResourceFormat.online.name]
    mock_log.assert_called_once_with("Invalid format %s", "bad_format")


@pytest.mark.parametrize(
    ("offered_by", "availability", "has_cert"),
    [
        [  # noqa: PT007
            OfferedBy.ocw.name,
            AvailabilityType.archived.value,
            False,
        ],
        [  # noqa: PT007
            OfferedBy.ocw.name,
            AvailabilityType.current.value,
            False,
        ],
        [  # noqa: PT007
            OfferedBy.mitx.name,
            AvailabilityType.archived.value,
            False,
        ],
        [  # noqa: PT007
            OfferedBy.mitx.name,
            AvailabilityType.current.value,
            True,
        ],
        [  # noqa: PT007
            OfferedBy.mitx.name,
            AvailabilityType.upcoming.value,
            True,
        ],
    ],
)
def test_parse_certification(offered_by, availability, has_cert):
    """The parse_certification function should return the expected bool value"""
    offered_by_obj = LearningResourceOfferorFactory.create(code=offered_by)

    resource = LearningResourceRunFactory.create(
        availability=availability,
        learning_resource=LearningResourceFactory.create(
            published=True,
            resource_type=LearningResourceType.podcast.name,
            offered_by=offered_by_obj,
        ),
    ).learning_resource
    assert resource.runs.first().availability == availability
    assert resource.runs.count() == 1
    assert (
        parse_certification(
            offered_by_obj.code,
            LearningResourceSerializer(instance=resource).data["runs"],
        )
        == has_cert
    )
