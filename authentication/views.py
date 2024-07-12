"""Authentication views"""

from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import views
from django.shortcuts import redirect
from social_django.utils import load_strategy

from authentication.backends.ol_open_id_connect import OlOpenIdConnectAuth


class CustomLogoutView(views.LogoutView):
    """
    Ends the user's Keycloak session in additional to the built in Django logout.
    """

    def _keycloak_logout_url(self, user):
        """
        Return the OpenID Connect logout URL for a user based on
        their SocialAuth record's id_token and the currently
        configured Keycloak environment variables.

        Args:
            user (User): User model record associated with the SocialAuth record.

        Returns:
            string: The URL to redirect the user to in order to logout.
        """
        strategy = load_strategy()
        storage = strategy.storage
        user_social_auth_record = storage.user.get_social_auth_for_user(
            user, provider=OlOpenIdConnectAuth.name
        ).first()
        id_token = user_social_auth_record.extra_data.get("id_token")
        qs = urlencode(
            {
                "id_token_hint": id_token,
                "post_logout_redirect_uri": self.request.build_absolute_uri(
                    settings.LOGOUT_REDIRECT_URL
                ),
            }
        )

        return (
            f"{settings.KEYCLOAK_BASE_URL}/realms/"
            f"{settings.KEYCLOAK_REALM_NAME}/protocol/openid-connect/logout"
            f"?{qs}"
        )

    def get(
        self,
        request,
        *args,  # noqa: ARG002
        **kwargs,  # noqa: ARG002
    ):
        """
        GET endpoint for loggin a user out.

        The logout redirect path the user follows is:

        - api.example.com/logout (this view)
        - keycloak.example.com/realms/REALM/protocol/openid-connect/logout
        - api.example.com/app (see main/urls.py)
        - app.example.com

        """
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            super().get(request)
            return redirect(self._keycloak_logout_url(user))
        else:
            return redirect("/app")
