"""Tests for environment variable parsing functions"""

from unittest.mock import patch

import pytest

from main.envs import (
    EnvironmentVariableParseException,
    get_bool,
    get_float,
    get_int,
    get_list_of_str,
    get_string,
)

FAKE_ENVIRONS = {
    "true": "True",
    "false": "False",
    "positive": "123",
    "negative": "-456",
    "zero": "0",
    "float-positive": "1.1",
    "float-negative": "-1.1",
    "float-zero": "0.0",
    "expression": "123-456",
    "none": "None",
    "string": "a b c d e f g",
    "list_of_int": "[3,4,5]",
    "list_of_str": '["x", "y", \'z\']',
}


def test_get_string():
    """
    get_string should get the string from the environment variable
    """
    with patch("main.envs.os", environ=FAKE_ENVIRONS):
        for key, value in FAKE_ENVIRONS.items():
            assert get_string(key, "default") == value
        assert get_string("missing", "default") == "default"
        assert get_string("missing", "default") == "default"


def test_get_int():
    """
    get_int should get the int from the environment variable, or raise an exception if it's not parseable as an int
    """
    with patch("main.envs.os", environ=FAKE_ENVIRONS):
        assert get_int("positive", 1234) == 123
        assert get_int("negative", 1234) == -456
        assert get_int("zero", 1234) == 0

        for key, value in FAKE_ENVIRONS.items():
            if key not in ("positive", "negative", "zero"):
                with pytest.raises(EnvironmentVariableParseException) as ex:
                    get_int(key, 1234)
                assert (
                    ex.value.args[0] == f"Expected value in {key}={value} to be an int"
                )

        assert get_int("missing", "default") == "default"


def test_get_float():
    """
    get_float should get the float from the environment variable, or raise an exception if it's not parseable as an float
    """
    with patch("main.envs.os", environ=FAKE_ENVIRONS):
        assert get_float("positive", 1234) == 123
        assert get_float("negative", 1234) == -456
        assert get_float("zero", 1234) == 0
        assert get_float("float-positive", 1234) == 1.1
        assert get_float("float-negative", 1234) == -1.1
        assert get_float("float-zero", 1234) == 0.0

        for key, value in FAKE_ENVIRONS.items():
            if key not in (
                "positive",
                "negative",
                "zero",
                "float-zero",
                "float-positive",
                "float-negative",
            ):
                with pytest.raises(EnvironmentVariableParseException) as ex:
                    get_float(key, 1234)
                assert (
                    ex.value.args[0] == f"Expected value in {key}={value} to be a float"
                )

        assert get_float("missing", "default") == "default"


def test_get_bool():
    """
    get_bool should get the bool from the environment variable, or raise an exception if it's not parseable as a bool
    """
    with patch("main.envs.os", environ=FAKE_ENVIRONS):
        assert get_bool("true", 1234) is True
        assert get_bool("false", 1234) is False

        for key, value in FAKE_ENVIRONS.items():
            if key not in ("true", "false"):
                with pytest.raises(EnvironmentVariableParseException) as ex:
                    get_bool(key, 1234)
                assert (
                    ex.value.args[0]
                    == f"Expected value in {key}={value} to be a boolean"
                )

        assert get_bool("missing", "default") == "default"


def test_get_list_of_str():
    """
    get_list_of_str should parse a list of strings
    """
    with patch("main.envs.os", environ=FAKE_ENVIRONS):
        assert get_list_of_str("list_of_str", ["noth", "ing"]) == ["x", "y", "z"]

        for key, value in FAKE_ENVIRONS.items():
            if key != "list_of_str":
                with pytest.raises(EnvironmentVariableParseException) as ex:
                    get_list_of_str(key, ["noth", "ing"])
                assert (
                    ex.value.args[0]
                    == f"Expected value in {key}={value} to be a list of str"
                )

        assert get_list_of_str("missing", "default") == "default"
