import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from django_scim import constants
from django_scim.adapters import SCIMUser

from profiles.models import Profile

User = get_user_model()


logger = logging.getLogger(__name__)


def get_user_model_for_scim():
    """
    Get function for the django_scim library configuration (USER_MODEL_GETTER).

    Returns:
        model: Profile model.
    """
    return Profile


class SCIMProfile(SCIMUser):
    """
    Custom adapter to extend django_scim library.  This is required in order
    to extend the profiles.models.Profile model to work with the
    django_scim library.
    """

    password_changed = False
    activity_changed = False

    resource_type = "User"

    @property
    def is_new_user(self):
        """_summary_

        Returns:
            bool: True is the user does not currently exist,
            False if the user already exists.
        """
        return not bool(self.profile.id)

    @property
    def profile(self):
        """
        Return the Profile
        """
        return self.obj

    @property
    def emails(self):
        """
        Return the email of the user per the SCIM spec.
        """
        return [{"value": self.profile.user.email, "primary": True}]

    @property
    def display_name(self):
        """
        Return the displayName of the user per the SCIM spec.
        """
        return self.profile.name

    @property
    def meta(self):
        """
        Return the meta object of the user per the SCIM spec.
        """
        return {
            "resourceType": self.resource_type,
            "created": self.profile.user.date_joined.isoformat(timespec="milliseconds"),
            "lastModified": self.profile.updated_at.isoformat(timespec="milliseconds"),
            "location": self.location,
        }

    def to_dict(self):
        """
        Return a ``dict`` conforming to the SCIM User Schema,
        ready for conversion to a JSON object.
        """
        return {
            "id": self.id,
            "externalId": self.profile.scim_external_id,
            "schemas": [constants.SchemaURI.USER],
            "userName": self.profile.user.username,
            "name": {
                "givenName": self.profile.user.first_name,
                "familyName": self.profile.user.last_name,
                "formatted": self.name_formatted,
            },
            "displayName": self.display_name,
            "emails": self.emails,
            "active": self.profile.user.is_active,
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
        self.profile.user = self.obj.user or User()

        self.parse_active(d.get("active"))

        self.profile.user.first_name = d.get("name", {}).get("givenName") or ""

        self.profile.user.last_name = d.get("name", {}).get("familyName") or ""

        super().parse_emails(d.get("emails"))

        self.obj.scim_username = d.get("userName")
        self.obj.scim_external_id = d.get("externalId") or ""

    def parse_active(self, active):
        """
        Set User.is_active to the value from the SCIM request.

        Args:
            active (bool): The value of 'active' from the SCIM request.
        """
        if active is not None:
            if active != self.obj.user.is_active:
                self.activity_changed = True
            self.obj.user.is_active = active

    def save(self):
        """
        Save instances of the Profile and User models.

        Raises:
        self.reformat_exception: Error while creating or saving Profile or User model.
        """
        try:
            with transaction.atomic():
                self.obj.user.save()
                self.obj.save()
                logger.info("User saved. User id %i", self.obj.id)
        except Exception as e:
            raise self.reformat_exception(e) from e

    def delete(self):
        """
        Update User's is_active to False.
        """
        self.profile.user.is_active = False
        self.profile.user.save()
        logger.info("Deactivated user id %i", self.obj.user.id)

    def handle_add(self, path, value):
        """
        Handle add operations per:
        https://tools.ietf.org/html/rfc7644#section-3.5.2.1

        Args:
            path (AttrPath)
            value (Union[str, list, dict])
        """
        if path == "externalId":
            self.obj.scim_external_id = value
            self.obj.save()

    def handle_replace(self, value):
        """
        Handle the replace operations.

        All operations happen within an atomic transaction.

        Args:
            value (Union[str, list, dict])
        """
        attr_map = {
            "familyName": "last_name",
            "givenName": "first_name",
            "active": "is_active",
            "userName": "scim_username",
            "externalId": "scim_external_id",
        }

        for attr, attr_value in (value or {}).items():
            if attr in attr_map:
                setattr(self.obj, attr_map.get(attr), attr_value)

            elif attr == "emails":
                self.parse_email(attr_value)

        self.obj.save()
