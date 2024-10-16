import logging
from typing import Optional, Union

from django.contrib.auth import get_user_model
from django.db import transaction
from django_scim import constants, exceptions
from django_scim.adapters import SCIMUser
from scim2_filter_parser.attr_paths import AttrPath

from profiles.models import Profile

User = get_user_model()


logger = logging.getLogger(__name__)


def get_user_model_for_scim():
    """
    Get function for the django_scim library configuration (USER_MODEL_GETTER).

    Returns:
        model: User model.
    """
    return User


class LearnSCIMUser(SCIMUser):
    """
    Custom adapter to extend django_scim library.  This is required in order
    to extend the profiles.models.Profile model to work with the
    django_scim library.
    """

    password_changed = False
    activity_changed = False

    resource_type = "User"

    id_field = "profile__scim_id"

    ATTR_MAP = {
        ("active", None, None): "is_active",
        ("userName", None, None): ("username", "profile__scim_external_username"),
    }

    @property
    def is_new_user(self):
        """_summary_

        Returns:
            bool: True is the user does not currently exist,
            False if the user already exists.
        """
        return not bool(self.obj.id)

    @property
    def emails(self):
        """
        Return the email of the user per the SCIM spec.
        """
        return [{"value": self.user.email, "primary": True}]

    @property
    def display_name(self):
        """
        Return the displayName of the user per the SCIM spec.
        """
        return self.obj.profile.name

    @property
    def meta(self):
        """
        Return the meta object of the user per the SCIM spec.
        """
        return {
            "resourceType": self.resource_type,
            "created": self.obj.date_joined.isoformat(timespec="milliseconds"),
            "lastModified": self.obj.profile.updated_at.isoformat(
                timespec="milliseconds"
            ),
            "location": self.location,
        }

    def to_dict(self):
        """
        Return a ``dict`` conforming to the SCIM User Schema,
        ready for conversion to a JSON object.
        """
        return {
            "id": self.id,
            "externalId": self.obj.profile.scim_external_id,
            "schemas": [constants.SchemaURI.USER],
            "userName": self.user.username,
            "name": {
                "givenName": self.user.first_name,
                "familyName": self.user.last_name,
                "formatted": self.name_formatted,
            },
            "displayName": self.display_name,
            "emails": self.emails,
            "active": self.user.is_active,
            "groups": [],
            "meta": self.meta,
        }

    def from_dict(self, d):
        """
        Consume a ``dict`` conforming to the SCIM User Schema, updating the
        internal user object with data from the ``dict``.

        Please note, the user object is not saved within this method. To
        persist the changes made by this method, please call ``.save()`` on the
        adapter. Eg::

            scim_user.from_dict(d)
            scim_user.save()
        """
        self.parse_active(d.get("active"))
        self.parse_emails(d.get("emails"))

        # these are unused, but are left here because the fields exist
        self.obj.first_name = d.get("name", {}).get("givenName", "")
        self.obj.last_name = d.get("name", {}).get("familyName", "")

        self.obj.profile = self.obj.profile or Profile(user=self.obj)
        self.obj.profile.scim_username = d.get("userName")
        self.obj.profile.scim_external_id = d.get("externalId")
        self.obj.profile.name = d.get("name", {}).get("formatted", "")

    def save(self):
        """
        Save instances of the Profile and User models.

        Raises:
        self.reformat_exception: Error while creating or saving Profile or User model.
        """
        try:
            with transaction.atomic():
                # user must be saved first due to FK Profile -> User
                self.obj.save()
                self.obj.profile.save()
                logger.info("User saved. User id %i", self.obj.id)
        except Exception as e:
            raise self.reformat_exception(e) from e

    def delete(self):
        """
        Update User's is_active to False.
        """
        self.obj.is_active = False
        self.obj.save()
        logger.info("Deactivated user id %i", self.obj.user.id)

    def handle_add(
        self,
        path: Optional[AttrPath],
        value: Union[str, list, dict],
        operation: dict,  # noqa: ARG002
    ):
        """
        Handle add operations per:
        https://tools.ietf.org/html/rfc7644#section-3.5.2.1

        Args:
            path (AttrPath)
            value (Union[str, list, dict])
        """
        if path is None:
            return

        if path.first_path == ("externalId", None, None):
            self.obj.profile.scim_external_id = value
            self.obj.save()

    def handle_replace(
        self,
        path: Optional[AttrPath],
        value: Union[str, list, dict],
        operation: dict,  # noqa: ARG002
    ):
        """
        Handle the replace operations.

        All operations happen within an atomic transaction.
        """
        if not isinstance(value, dict):
            # Restructure for use in loop below.
            value = {path: value}

        for nested_path, nested_value in (value or {}).items():
            if nested_path.first_path in self.ATTR_MAP:
                self._set_obj_path(nested_path.first_path, nested_value)

            elif nested_path.first_path == ("emails", None, None):
                self.parse_emails(value)

            else:
                msg = "Not Implemented"
                raise exceptions.NotImplementedError(msg)

        self.save()

        self.obj.save()
