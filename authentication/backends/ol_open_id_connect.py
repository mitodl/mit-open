"""Keycloak Authentication Configuration"""  # noqa: INP001

from social_core.backends.open_id_connect import OpenIdConnectAuth

from main.utils import filter_dict_keys


class OlOpenIdConnectAuth(OpenIdConnectAuth):
    """
    Custom wrapper class for adding additional functionality to the
    OpenIdConnectAuth child class.
    """

    name = "ol-oidc"

    def get_user_details(self, response):
        """Get the user details from the API response"""
        username_key = self.setting("USERNAME_KEY", self.USERNAME_KEY)
        profile = filter_dict_keys(
            response.get("profile", {}), ["name", "email_optin"], optional=True
        )
        profile["email_optin"] = "global" in profile.get("email_optin", ["global"])
        return {
            "username": response.get(username_key),
            "email": response.get("email"),
            "first_name": response.get("given_name"),
            "last_name": response.get("family_name"),
            "profile": profile,
        }
