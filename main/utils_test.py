"""Utils tests"""

import datetime
from math import ceil
from tempfile import NamedTemporaryFile

import pytest
from django.contrib.auth import get_user_model

from main.factories import UserFactory
from main.utils import (
    chunks,
    clean_data,
    extract_values,
    filter_dict_keys,
    filter_dict_with_renamed_keys,
    frontend_absolute_url,
    html_to_plain_text,
    is_near_now,
    markdown_to_plain_text,
    merge_strings,
    normalize_to_start_of_day,
    now_in_utc,
    prefetched_iterator,
    write_to_file,
)

User = get_user_model()


def test_now_in_utc():
    """now_in_utc() should return the current time set to the UTC time zone"""
    now = now_in_utc()
    assert is_near_now(now)
    assert now.tzinfo == datetime.UTC


def test_is_near_now():
    """
    Test is_near_now for now
    """
    now = datetime.datetime.now(tz=datetime.UTC)
    assert is_near_now(now) is True
    later = now + datetime.timedelta(0, 6)
    assert is_near_now(later) is False
    earlier = now - datetime.timedelta(0, 6)
    assert is_near_now(earlier) is False


def test_normalize_to_start_of_day():
    """
    Test that normalize_to_start_of_day zeroes out the time components
    """
    assert normalize_to_start_of_day(
        datetime.datetime(2018, 1, 3, 5, 6, 7)  # noqa: DTZ001
    ) == datetime.datetime(  # noqa: DTZ001
        2018, 1, 3
    )


def test_chunks():
    """
    test for chunks
    """
    input_list = list(range(113))
    output_list = []
    for nums in chunks(input_list):
        output_list += nums
    assert output_list == input_list

    output_list = []
    for nums in chunks(input_list, chunk_size=1):
        output_list += nums
    assert output_list == input_list

    output_list = []
    for nums in chunks(input_list, chunk_size=124):
        output_list += nums
    assert output_list == input_list


def test_chunks_iterable():
    """
    test that chunks works on non-list iterables too
    """
    count = 113
    input_range = range(count)
    chunk_output = []
    for chunk in chunks(input_range, chunk_size=10):
        chunk_output.append(chunk)  # noqa: PERF402
    assert len(chunk_output) == ceil(113 / 10)

    range_list = []
    for chunk in chunk_output:
        range_list += chunk
    assert range_list == list(range(count))


@pytest.mark.parametrize(
    ("list_or_string", "output"),
    [
        ["str", ["str"]],  # noqa: PT007
        [["str", None, [None]], ["str"]],  # noqa: PT007
        [[["a"], "b", ["c", "d"], "e"], ["a", "b", "c", "d", "e"]],  # noqa: PT007
    ],
)
def test_merge_strings(list_or_string, output):
    """
    merge_strings should flatten a nested list of strings
    """
    assert merge_strings(list_or_string) == output


def test_filter_dict_keys():
    """filter_dict_keys should return a dict with only the specified list of keys"""
    d = {"a": 1, "b": 2, "c": 3, "d": 4}
    assert filter_dict_keys(d, ["b", "d"]) == {"b": 2, "d": 4}

    with pytest.raises(KeyError):
        assert filter_dict_keys(d, ["b", "missing"])

    assert filter_dict_keys(d, ["b", "missing"], optional=True) == {"b": 2}


def test_filter_dict_with_renamed_keys():
    """
    filter_dict_with_renamed_keys should return a dict with only the keys in a filter dict,
    and should rename those keys according to the values in the filter dict.
    """
    d = {"a": 1, "b": 2, "c": 3, "d": 4}
    assert filter_dict_with_renamed_keys(d, {"b": "b1", "d": "d1"}) == {
        "b1": 2,
        "d1": 4,
    }

    with pytest.raises(KeyError):
        assert filter_dict_with_renamed_keys(d, {"b": "b1", "missing": "d1"})

    assert filter_dict_with_renamed_keys(
        d, {"b": "b1", "missing": "d1"}, optional=True
    ) == {"b1": 2}


def test_html_to_plain_text():
    """
    html_to_plain_text should turn a string with HTML markup into plain text with line breaks
    replaced by spaces.
    """
    html = "<div><b>bold</b><p>text with\n\nline breaks</p></div>"
    normal_text = "open discussions"
    assert html_to_plain_text(html) == "boldtext with  line breaks"
    assert html_to_plain_text(normal_text) == normal_text


def test_markdown_to_plain_text():
    """
    markdown_to_plain_text should turn a Markdown string into plain text with line breaks
    replaced by spaces.
    """
    markdown = "# header\n\nsome body text\n\n1. bullet 1\n2. bullet 2"
    normal_text = "open discussions"
    assert (
        markdown_to_plain_text(markdown) == "header some body text  bullet 1 bullet 2"
    )
    assert html_to_plain_text(normal_text) == normal_text


@pytest.mark.django_db()
@pytest.mark.parametrize("chunk_size", [2, 3, 5, 7, 9, 10])
def test_prefetched_iterator(chunk_size):
    """
    prefetched_iterator should yield all items in the record set across chunk boundaries
    """
    users = UserFactory.create_batch(10)
    fetched_users = list(prefetched_iterator(User.objects.all(), chunk_size=chunk_size))
    assert len(users) == len(fetched_users)
    for user in users:
        assert user in fetched_users


def test_extract_values():
    """
    extract_values should return the correct match from a dict
    """
    test_json = {
        "a": {"b": {"c": [{"d": [1, 2, 3]}, {"d": [4, 5], "e": "f", "b": "g"}]}}
    }
    assert extract_values(test_json, "b") == [test_json["a"]["b"], "g"]
    assert extract_values(test_json, "d") == [[1, 2, 3], [4, 5]]
    assert extract_values(test_json, "e") == ["f"]


def test_write_to_file():
    """Test that write_to_file creates a file with the correct contents"""
    content = (
        b"-----BEGIN"
        b" CERTIFICATE-----\nMIID5DCCA02gAwIBAgIRTUTVwsj4Vy+l6+XTYjnIQ==\n-----END"
        b" CERTIFICATE-----"
    )
    with NamedTemporaryFile() as outfile:
        write_to_file(outfile.name, content)
        with open(outfile.name, "rb") as infile:  # noqa: PTH123
            assert infile.read() == content


def test_frontend_absolute_url(settings):
    """
    frontend_absolute_url should generate urls to the frontend
    """
    settings.APP_BASE_URL = "http://example.com/"

    assert frontend_absolute_url("/") == "http://example.com/"
    assert frontend_absolute_url("/path") == "http://example.com/path"
    assert frontend_absolute_url("path") == "http://example.com/path"


@pytest.mark.parametrize(
    ("input_text", "output_text"),
    [
        ("The cat sat on the mat & spat.\n", "The cat sat on the mat &amp; spat.\n"),
        (
            "the <b class='foo'>dog</b> chased a <a href='http://hog.mit.edu'>hog</a>",
            "the <b>dog</b> chased a hog",
        ),
        (
            "<p><style type='text/css'> <!--/*--><![CDATA[/* ><!--*/ <!--td {border: 1px solid #ccc;}br {mso-data-placement:same-cell;}--> /*--><!]]>*/ </style>What a mess</p>",
            "<p>What a mess</p>",
        ),
        (
            "<script type='javascript'>alert('xss');</script><style>\nh1 {color:red;}\np {color:blue;}\n</style><p>Some text</p>",
            "<p>Some text</p>",
        ),
        (
            "<p><img src='' onerror='alert(\"xss!\")'/>Hello, world!</p>",
            "<p>Hello, world!</p>",
        ),
        (None, ""),
        ("", ""),
    ],
)
def test_clean_data(input_text, output_text):
    """clean_data function should return expected output"""
    assert clean_data(input_text) == output_text
