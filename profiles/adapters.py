import copy
import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from django_scim import constants
from django_scim import exceptions as scim_exceptions
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

    def __init__(self, obj, request=None):
        super().__init__(obj, request)
        self._from_dict_copy = None

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
        return [{"value": self.obj.user.email, "primary": True}]

    @property
    def display_name(self):
        """
        Return the displayName of the user per the SCIM spec.
        """
        if self.obj.first_name and self.obj.last_name:
            return f"{self.obj.first_name} {self.obj.last_name}"
        return self.obj.user.email

    @property
    def meta(self):
        """
        Return the meta object of the user per the SCIM spec.
        """
        return {
            "resourceType": self.resource_type,
            "created": self.obj.user.date_joined.isoformat(timespec="milliseconds"),
            "lastModified": self.obj.updated_at.isoformat(timespec="milliseconds"),
            "location": self.location,
        }

    def to_dict(self):
        """
        Return a ``dict`` conforming to the SCIM User Schema,
        ready for conversion to a JSON object.
        """
        return {
            "id": self.id,
            "externalId": self.obj.scim_external_id,
            "schemas": [constants.SchemaURI.USER],
            "userName": self.obj.user.username,
            "name": {
                "givenName": self.obj.user.first_name,
                "familyName": self.obj.user.last_name,
                "formatted": self.name_formatted,
            },
            "displayName": self.display_name,
            "emails": self.emails,
            "active": self.obj.user.is_active,
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
        # Store dict for possible later use when saving user
        self._from_dict_copy = copy.deepcopy(d)

        self.obj.user = User()

        self.parse_active(d.get("active"))

        self.obj.first_name = d.get("name", {}).get("givenName") or ""

        self.obj.last_name = d.get("name", {}).get("familyName") or ""

        super().parse_emails(d.get("emails"))

        if self.is_new_user and not self.obj.email:
            raise scim_exceptions.BadRequestError("Empty email value")  # noqa: TRY003 EM101

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
                self.obj.user.email = self.obj.email
                self.obj.user.username = self.obj.email
                self.obj.user.first_name = self.obj.first_name
                self.obj.user.last_name = self.obj.last_name
                self.obj.user.save()
                self.obj.name = self.display_name
                self.obj.save()
                logger.info("User saved. User id %i", self.obj.id)
        except Exception as e:
            raise self.reformat_exception(e) from e

    def delete(self):
        """
        Update User's is_active to False.
        """
        self.obj.is_active = False
        self.obj.save()
        logger.info("Deactivated user id %i", self.obj.id)

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

            elif attr == "password":
                self.obj.set_password(attr_value)

            else:
                raise scim_exceptions.SCIMException("Not Implemented", status=409)  # noqa: EM101, TRY003

        self.obj.save()
