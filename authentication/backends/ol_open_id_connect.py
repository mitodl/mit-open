"""Keycloak Authentication Configuration"""  # noqa: INP001

from social_core.backends.open_id_connect import OpenIdConnectAuth


class OlOpenIdConnectAuth(OpenIdConnectAuth):
    """
    Custom wrapper class for adding additional functionality to the
    OpenIdConnectAuth child class.
    """

    name = "ol-oidc"

    def get_user_details(self, response):
        """Get the user details from the API response"""
        details = super().get_user_details(response)

        return {
            **details,
            "profile": {
                "name": response.get("full_name", ""),
                "email_optin": response.get("email_optin", None),
            },
        }
