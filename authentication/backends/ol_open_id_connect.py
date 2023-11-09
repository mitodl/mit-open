"""Keycloak Authentication Configuration"""  # noqa: INP001

import jwt
from jwt import (
    ExpiredSignatureError,
    InvalidAudienceError,
    InvalidTokenError,
    PyJWTError,
)
from social_core.backends.open_id_connect import OpenIdConnectAuth
from social_core.exceptions import AuthTokenError


class OlOpenIdConnectAuth(OpenIdConnectAuth):
    """
    Custom wrapper class for adding additional functionality to the
    OpenIdConnectAuth child class.
    """

    name = "ol-oidc"

    def validate_logout_token_and_return_claims(self, logout_token):
        """
        Validate the token using jwt library.

        Args:
            logout_token (string): jwt logout token.

        Raises:
            AuthTokenError: Signature has expired.
            AuthTokenError: Invalid audience.
            AuthTokenError: Invalid signature
            AuthTokenError: Invalid token.
            AuthTokenError: Signature verification failed.

        Returns:
            Dict: dictionary of claims from the logout token jwt.
        """
        client_id, _ = self.get_key_and_secret()

        key = self.find_valid_key(logout_token)

        if not key:
            raise AuthTokenError(self, "Signature verification failed")

        rsakey = jwt.PyJWK(key)

        try:
            claims = jwt.decode(
                logout_token,
                rsakey.key,
                algorithms=self.setting("JWT_ALGORITHMS", self.JWT_ALGORITHMS),
                audience=client_id,
                issuer=self.id_token_issuer(),
                options=self.setting("JWT_DECODE_OPTIONS", self.JWT_DECODE_OPTIONS),
            )
        except ExpiredSignatureError:
            raise AuthTokenError(self, "Signature has expired") from None
        except InvalidAudienceError:
            # compatibility with jose error message
            raise AuthTokenError(self, "Token error: Invalid audience") from None
        except InvalidTokenError as error:
            raise AuthTokenError(self, str(error)) from None
        except PyJWTError:
            raise AuthTokenError(self, "Invalid signature") from None

        return claims
