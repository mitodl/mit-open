from typing import Optional

from django_scim.filters import UserFilterQuery


class LearnUserFilterQuery(UserFilterQuery):
    """Filters for users"""

    attr_map: dict[tuple[Optional[str], Optional[str], Optional[str]], str] = {
        ("userName", None, None): "auth_users.username",
        ("active", None, None): "auth_users.is_active",
        ("name", "formatted", None): "profiles_profile.name",
    }

    joins: tuple[str, ...] = (
        "INNER JOIN profiles_profile ON profiles_profile.user_id = id",
    )
