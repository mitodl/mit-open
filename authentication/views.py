"""Authentication views"""

from django.conf import settings
from django.contrib.auth import views
from django.http import Http404
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
        return f"{settings.KEYCLOAK_BASE_URL}/realms/{settings.KEYCLOAK_REALM_NAME}/protocol/openid-connect/logout?id_token_hint={id_token}"  # noqa: E501

    def get(
        self,
        request,
        *args,  # noqa: ARG002
        **kwargs,  # noqa: ARG002
    ):  # pylint:disable=unused-argument
        """
        GET endpoint for loggin a user out.
        Raises 404 if the user is not included in the request.
        """
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            super().get(request)
            return redirect(self._keycloak_logout_url(user))
        else:
            msg = "Not currently logged in."
            raise Http404(msg)
