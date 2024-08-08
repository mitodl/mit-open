#!/usr/bin/env python3
"""
Standard manage.py command from django startproject
"""

import os
import sys


def set_env_vars_from_legacy_prefix():
    """
    Walk the environment variables and set the new MITOL_ prefixed ones
    from legacy MIT_OPEN_ prefixed ones
    """
    for old_key in os.environ:
        if old_key.startswith("MIT_OPEN_"):
            new_key = old_key.replace("MIT_OPEN_", "MITOL_")

            os.environ[new_key] = os.environ[old_key]


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "main.settings")

    set_env_vars_from_legacy_prefix()

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
