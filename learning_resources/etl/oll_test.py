"""Tests for the OLL ETL functions"""

# pylint: disable=redefined-outer-name

import pytest

from learning_resources.etl.oll import extract, transform


@pytest.fixture
def oll_course_data():
    """Fixture for valid OLL catalog data"""
    with open("./learning_resources/data/oll_metadata.csv") as f:  # noqa: PTH123
        return f.read()


@pytest.mark.parametrize("sheets_id", [None, "abc123"])
def test_extract(mocker, oll_course_data, sheets_id):
    """
    Verify that the extract function returns the expected data
    """
    mocker.patch(
        "learning_resources.etl.oll.requests.get",
        return_value=mocker.Mock(content=oll_course_data.encode("utf-8")),
    )
    assert extract(sheets_id=sheets_id) == oll_course_data


def test_oll_transform(mocker, oll_course_data):
    """Verify that courses are transformed correctly"""
    results = list(transform(oll_course_data))
    assert len(results) == 60

    assert results[0] == {
        "title": "Introduction to Probability and Statistics",
        "readable_id": "18.05+summer_2022",
        "url": "https://openlearninglibrary.mit.edu/courses/course-v1:MITx+18.05r_10+2022_Summer/about",
        "description": mocker.ANY,
        "full_description": mocker.ANY,
        "offered_by": {"code": "ocw"},
        "platform": "oll",
        "published": True,
        "topics": [{"name": "Mathematics"}, {"name": "Data Science"}],
        "course": {
            "course_numbers": [
                {
                    "value": "18.05",
                    "listing_type": "primary",
                    "department": None,
                    "sort_coursenum": "18.05",
                    "primary": True,
                }
            ]
        },
        "runs": [
            {
                "title": "Introduction to Probability and Statistics",
                "run_id": "MITx+18.05r_10+2022_Summer",
                "url": "https://openlearninglibrary.mit.edu/courses/course-v1:MITx+18.05r_10+2022_Summer/about",
                "published": True,
                "description": mocker.ANY,
                "image": {
                    "url": "https://openlearninglibrary.mit.edu/asset-v1:MITx+18.05r_10+2022_Summer+type@asset+block@mit18_05_s22_chp.jpg",
                    "alt": "Introduction to Probability and Statistics",
                },
                "prices": [0.00],
                "level": ["undergraduate"],
                "instructors": [
                    {"full_name": "Jeremy Orloff"},
                    {"full_name": "Jennifer French Kamrin"},
                ],
                "semester": "Summer",
                "year": 2022,
                "status": "Archived",
                "availability": "anytime",
                "pace": ["self_paced"],
                "format": ["asynchronous"],
                "duration": "14 days",
                "time_commitment": "14 hours",
            }
        ],
        "image": {
            "url": "https://openlearninglibrary.mit.edu/asset-v1:MITx+18.05r_10+2022_Summer+type@asset+block@mit18_05_s22_chp.jpg",
            "alt": "Introduction to Probability and Statistics",
        },
        "prices": [0.00],
        "etl_source": "oll",
        "availability": "anytime",
        "pace": ["self_paced"],
        "format": ["asynchronous"],
    }
    assert results[2] == {
        "title": "Competency-Based Education",
        "readable_id": "MITx+0.502x",
        "url": "https://openlearninglibrary.mit.edu/courses/course-v1:MITx+0.502x+1T2019/about",
        "description": mocker.ANY,
        "full_description": mocker.ANY,
        "offered_by": {"code": "mitx"},
        "platform": "oll",
        "published": True,
        "topics": [{"name": "Education Policy"}, {"name": "Digital Learning"}],
        "course": {
            "course_numbers": [
                {
                    "value": "0.502x",
                    "listing_type": "primary",
                    "department": None,
                    "sort_coursenum": "0.502x",
                    "primary": True,
                }
            ]
        },
        "runs": [
            {
                "title": "Competency-Based Education",
                "run_id": "MITx+0.502x+1T2019",
                "url": "https://openlearninglibrary.mit.edu/courses/course-v1:MITx+0.502x+1T2019/about",
                "published": True,
                "description": mocker.ANY,
                "image": {
                    "url": "https://openlearninglibrary.mit.edu/asset-v1:MITx+0.502x+1T2019+type@asset+block@course_image.png",
                    "alt": "Competency-Based Education",
                },
                "prices": [0.00],
                "level": ["undergraduate"],
                "instructors": [
                    {"full_name": "Justin Reich"},
                    {"full_name": "Elizabeth Huttner-Loan"},
                ],
                "semester": "Spring",
                "year": 2019,
                "status": "Archived",
                "availability": "anytime",
                "pace": ["self_paced"],
                "format": ["asynchronous"],
                "duration": "6 days",
                "time_commitment": "",
            }
        ],
        "image": {
            "url": "https://openlearninglibrary.mit.edu/asset-v1:MITx+0.502x+1T2019+type@asset+block@course_image.png",
            "alt": "Competency-Based Education",
        },
        "prices": [0.00],
        "etl_source": "oll",
        "availability": "anytime",
        "pace": ["self_paced"],
        "format": ["asynchronous"],
    }
