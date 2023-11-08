"""
Django settings specific to DRF Spectacular
to offload from the main settings.py
"""

open_spectacular_settings = {
    "TITLE": "MIT Open API",
    "DESCRIPTION": "MIT public API",
    "VERSION": "0.0.1",
    "SERVE_INCLUDE_SCHEMA": False,
    "SERVE_URLCONF": "open_discussions.urls_spectacular",
    "ENUM_GENERATE_CHOICE_DESCRIPTION": True,
    "COMPONENT_SPLIT_REQUEST": True,
}
