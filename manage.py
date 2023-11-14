#!/usr/bin/env python3
"""
Standard manage.py command from django startproject
"""

import contextlib
import os
import sys

with contextlib.suppress(ImportError):
    from traceback_with_variables import activate_by_import  # noqa: F401

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "open_discussions.settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
