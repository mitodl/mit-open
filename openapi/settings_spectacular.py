"""
Django settings specific to DRF Spectacular
"""

open_spectacular_settings = {
    "TITLE": "MIT Open API",
    "DESCRIPTION": "MIT public API",
    "VERSION": "0.0.1",
    "SERVE_INCLUDE_SCHEMA": False,
    "SERVE_URLCONF": "main.urls",
    "ENUM_GENERATE_CHOICE_DESCRIPTION": True,
    "COMPONENT_SPLIT_REQUEST": True,
    "AUTHENTICATION_WHITELIST": [],
    "SCHEMA_PATH_PREFIX": "/api/v[0-9]",
    "POSTPROCESSING_HOOKS": [
        "drf_spectacular.hooks.postprocess_schema_enums",
        "openapi.hooks.postprocess_x_enum_descriptions",
    ],
}
