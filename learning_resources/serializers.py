"""Serializers for learning_resources"""
import logging

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import F, Max
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from learning_resources import constants, models
from open_discussions.serializers import WriteableSerializerMethodField

COMMON_IGNORED_FIELDS = ("created_on", "updated_on")

log = logging.getLogger(__name__)


class LearningResourceInstructorSerializer(serializers.ModelSerializer):
    """
    Serializer for LearningResourceInstructor model
    """

    class Meta:
        model = models.LearningResourceInstructor
        exclude = COMMON_IGNORED_FIELDS


class LearningResourceTopicSerializer(serializers.ModelSerializer):
    """
    Serializer for LearningResourceTopic model
    """

    class Meta:
        model = models.LearningResourceTopic
        fields = ["id", "name"]


class WriteableTopicsMixin(serializers.Serializer):
    """Class for editable topics"""

    topics = WriteableSerializerMethodField()

    def validate_topics(self, topics):
        """Validate specified topics exist."""
        if len(topics) > 0:
            if isinstance(topics[0], dict):
                topics = [topic["id"] for topic in topics]
            try:
                valid_topic_ids = set(
                    models.LearningResourceTopic.objects.filter(
                        id__in=topics
                    ).values_list("id", flat=True)
                )
            except ValueError as ve:
                msg = "Topic ids must be integers"
                raise ValidationError(msg) from ve
            missing = set(topics).difference(valid_topic_ids)
            if missing:
                msg = f"Invalid topic ids: {missing}"
                raise ValidationError(msg)
        return {"topics": topics}

    @extend_schema_field(LearningResourceTopicSerializer(many=True))
    def get_topics(self, instance):
        """Returns the list of topics"""  # noqa: D401
        return [
            LearningResourceTopicSerializer(topic).data
            for topic in instance.topics.all()
        ]


@extend_schema_field({"type": "string"})
class LearningResourceOfferorField(serializers.Field):
    """Serializer for LearningResourceOfferor"""

    def to_representation(self, value):
        """Serialize offered_by as the name only"""
        return value.name


@extend_schema_field({"type": "array", "items": {"type": "string"}})
class LearningResourceContentTagField(serializers.Field):
    """Serializer for LearningResourceContentTag"""

    def to_representation(self, value):
        """Serializes resource_content_tags as a list of OfferedBy names"""  # noqa: E501,D401
        return [tag.name for tag in value.all()]


@extend_schema_field({"type": "array", "items": {"type": "string"}})
class LearningResourceTopicsField(serializers.Field):
    """Serializer field for LearningResourceTopics"""

    def to_representation(self, value):
        """Serializes resource_content_tags as a list of OfferedBy names"""  # noqa: D401,E501
        return [topic.name for topic in value.all()]


class LearningResourcePlatformSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourcePlatform"""

    class Meta:
        model = models.LearningResourcePlatform
        exclude = COMMON_IGNORED_FIELDS


class LearningResourceDepartmentSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceDepartment"""

    class Meta:
        model = models.LearningResourceDepartment
        fields = ["department_id", "name"]


class LearningResourceImageSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceImage"""

    class Meta:
        model = models.LearningResourceImage
        exclude = COMMON_IGNORED_FIELDS


class LearningResourceRunSerializer(serializers.ModelSerializer):
    """Serializer for the LearningResourceRun model"""

    instructors = LearningResourceInstructorSerializer(
        read_only=True, allow_null=True, many=True
    )
    image = LearningResourceImageSerializer(read_only=True, allow_null=True)

    class Meta:
        model = models.LearningResourceRun
        exclude = ["learning_resource", *COMMON_IGNORED_FIELDS]


class ResourceListMixin(serializers.Serializer):
    """Common fields for LearningPath and other future resource lists"""

    item_count = serializers.SerializerMethodField()

    def get_item_count(self, instance) -> int:
        """Return the number of items in the list"""
        return (
            getattr(instance, "item_count", None)
            or instance.learning_resource.children.count()
        )


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for the Course model"""

    class Meta:
        model = models.Course
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class LearningPathSerializer(serializers.ModelSerializer, ResourceListMixin):
    """Serializer for the LearningPath model"""

    class Meta:
        model = models.LearningPath
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class PodcastEpisodeSerializer(serializers.ModelSerializer):
    """
    Serializer for PodcastEpisode
    """

    class Meta:
        model = models.PodcastEpisode
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class PodcastSerializer(serializers.ModelSerializer):
    """
    Serializer for Podcasts
    """

    episode_count = serializers.SerializerMethodField()

    def get_episode_count(self, instance) -> int:
        """Return the number of episodes in the podcast"""
        return instance.learning_resource.children.filter(
            relation_type=constants.LearningResourceRelationTypes.PODCAST_EPISODES.value
        ).count()

    class Meta:
        model = models.Podcast
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class MicroLearningPathRelationshipSerializer(serializers.ModelSerializer):
    """
    Serializer containing only parent and child ids for a learning path relationship
    """

    parent = serializers.ReadOnlyField(source="parent_id")
    child = serializers.ReadOnlyField(source="child_id")

    class Meta:
        model = models.LearningResourceRelationship
        fields = ("id", "parent", "child")


class MicroUserListRelationshipSerializer(serializers.ModelSerializer):
    """
    Serializer containing only parent and child ids for a user list relationship
    """

    parent = serializers.ReadOnlyField(source="parent_id")
    child = serializers.ReadOnlyField(source="child_id")

    class Meta:
        model = models.UserListRelationship
        fields = ("id", "parent", "child")


class LearningResourceBaseSerializer(serializers.ModelSerializer, WriteableTopicsMixin):
    """Serializer for LearningResource, minus program"""

    offered_by = LearningResourceOfferorField(read_only=True, allow_null=True)
    resource_content_tags = LearningResourceContentTagField(
        read_only=True, allow_null=True
    )
    department = LearningResourceDepartmentSerializer(read_only=True, allow_null=True)
    audience = serializers.ReadOnlyField()
    certification = serializers.ReadOnlyField()
    prices = serializers.ReadOnlyField()
    course = CourseSerializer(read_only=True, allow_null=True)
    learning_path = LearningPathSerializer(read_only=True, allow_null=True)
    podcast = PodcastSerializer(read_only=True, allow_null=True)
    podcast_episode = PodcastEpisodeSerializer(read_only=True, allow_null=True)
    runs = LearningResourceRunSerializer(read_only=True, many=True, allow_null=True)
    image = serializers.SerializerMethodField()
    learning_path_parents = serializers.SerializerMethodField()
    user_list_parents = serializers.SerializerMethodField()

    @extend_schema_field(LearningResourceImageSerializer(allow_null=True))
    def get_image(self, instance) -> dict:
        """
        Return the resource.image if it exists. Otherwise, for learning paths only,
        return the image of the first child resource.
        """
        if instance.image:
            return LearningResourceImageSerializer(instance=instance.image).data
        elif (
            instance.resource_type == constants.LearningResourceType.learning_path.value
        ):
            list_item = instance.children.order_by("position").first()
            if list_item and list_item.child.image:
                return LearningResourceImageSerializer(
                    instance=list_item.child.image
                ).data
            return None
        return None

    @extend_schema_field(
        MicroLearningPathRelationshipSerializer(many=True, allow_null=True)
    )
    def get_learning_path_parents(self, instance):
        """# noqa: D401
        Returns list of learning paths that resource is in, if the user has permission
        """
        request = self.context.get("request")
        user = request.user if request else None
        if (
            user
            and user.is_authenticated
            and (
                user.is_staff
                or user.is_superuser
                or user.groups.filter(name=constants.GROUP_STAFF_LISTS_EDITORS).first()
                is not None
            )
        ):
            return MicroLearningPathRelationshipSerializer(
                instance.parents.filter(
                    relation_type=constants.LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value
                ),
                many=True,
            ).data
        return []

    @extend_schema_field(
        MicroUserListRelationshipSerializer(many=True, allow_null=True)
    )
    def get_user_list_parents(self, instance):
        """Return a list of user lists that the resource is in, for specific user"""
        request = self.context.get("request")
        user = request.user if request else None
        if user and user.is_authenticated:
            return MicroUserListRelationshipSerializer(
                models.UserListRelationship.objects.filter(
                    parent__author=user, child=instance
                ),
                many=True,
            ).data
        return []

    class Meta:
        model = models.LearningResource
        exclude = ["resources", "etl_source", *COMMON_IGNORED_FIELDS]


class ProgramSerializer(serializers.ModelSerializer):
    """Serializer for the Program model"""

    courses = serializers.SerializerMethodField()

    @extend_schema_field(LearningResourceBaseSerializer(many=True, allow_null=True))
    def get_courses(self, obj):
        """Get the learning resource courses for a program"""
        return LearningResourceRelationshipChildField(
            obj.learning_resource.children.all(), many=True
        ).data

    class Meta:
        model = models.Program
        exclude = ("learning_resource", *COMMON_IGNORED_FIELDS)


class LearningResourceSerializer(LearningResourceBaseSerializer):
    """Serializer for LearningResource, with program included"""

    program = ProgramSerializer(read_only=True, allow_null=True)


class LearningResourceRelationshipChildField(serializers.ModelSerializer):
    """
    Serializer field for the LearningResourceRelationship model that uses
    the LearningResourceSerializer to serialize the child resources
    """

    def to_representation(self, instance):
        """Serializes child as a LearningResource"""  # noqa: D401
        return LearningResourceSerializer(instance=instance.child).data

    class Meta:
        model = models.LearningResourceRelationship
        exclude = ("parent", *COMMON_IGNORED_FIELDS)


class LearningPathResourceSerializer(LearningResourceSerializer):
    """CRUD serializer for LearningPath resources"""

    def validate_resource_type(self, value):
        """Only allow LearningPath resources to be CRUDed"""
        if value != constants.LearningResourceType.learning_path.value:
            msg = "Only LearningPath resources are editable"
            raise serializers.ValidationError(msg)
        return value

    def create(self, validated_data):
        """Ensure that the LearningPath is created by the requesting user; set topics"""
        request = self.context.get("request")
        topics_data = validated_data.pop("topics", [])
        with transaction.atomic():
            path_resource = super().create(validated_data)
            path_resource.topics.set(
                models.LearningResourceTopic.objects.filter(id__in=topics_data)
            )
            models.LearningPath.objects.create(
                learning_resource=path_resource, author=request.user
            )
        return path_resource

    def update(self, instance, validated_data):
        """Set learning path topics and update the model object"""
        topics_data = validated_data.pop("topics", None)
        with transaction.atomic():
            resource = super().update(instance, validated_data)
            if topics_data is not None:
                resource.topics.set(
                    models.LearningResourceTopic.objects.filter(id__in=topics_data)
                )
            return resource

    class Meta:
        model = models.LearningResource
        exclude = ["etl_source", *COMMON_IGNORED_FIELDS]
        read_only_fields = ["platform", "offered_by"]


class LearningResourceChildSerializer(serializers.ModelSerializer):
    """Serializer for LearningResourceRelationship children"""

    def to_representation(self, instance):
        """Serializes offered_by as a list of OfferedBy names"""  # noqa: D401
        return LearningResourceSerializer(instance.child).data

    class Meta:
        model = models.LearningResourceRelationship
        fields = ("child",)


class LearningResourceRelationshipSerializer(serializers.ModelSerializer):
    """CRUD serializer for LearningResourceRelationship"""

    resource = LearningResourceSerializer(read_only=True, source="child")

    def create(self, validated_data):
        resource = validated_data["parent"]
        items = models.LearningResourceRelationship.objects.filter(parent=resource)
        position = (
            items.aggregate(Max("position"))["position__max"] or items.count()
        ) + 1
        item, _ = models.LearningResourceRelationship.objects.get_or_create(
            parent=validated_data["parent"],
            child=validated_data["child"],
            relation_type=validated_data["relation_type"],
            defaults={"position": position},
        )
        return item

    def update(self, instance, validated_data):
        position = validated_data["position"]
        # to perform an update on position we atomically:
        # 1) move everything between the old position and the new position towards the old position by 1  # noqa: E501
        # 2) move the item into its new position
        # this operation gets slower the further the item is moved, but it is sufficient for now  # noqa: E501
        with transaction.atomic():
            path_items = models.LearningResourceRelationship.objects.filter(
                parent=instance.parent,
                relation_type=instance.relation_type,
            )
            if position > instance.position:
                # move items between the old and new positions up, inclusive of the new position  # noqa: E501
                path_items.filter(
                    position__lte=position, position__gt=instance.position
                ).update(position=F("position") - 1)
            else:
                # move items between the old and new positions down, inclusive of the new position  # noqa: E501
                path_items.filter(
                    position__lt=instance.position, position__gte=position
                ).update(position=F("position") + 1)
            # now move the item into place
            instance.position = position
            instance.save()

        return instance

    class Meta:
        model = models.LearningResourceRelationship
        extra_kwargs = {"position": {"required": False}}
        exclude = COMMON_IGNORED_FIELDS


class LearningPathRelationshipSerializer(LearningResourceRelationshipSerializer):
    """Specialized serializer for a LearningPath relationship"""

    relation_type = serializers.HiddenField(
        default=constants.LearningResourceRelationTypes.LEARNING_PATH_ITEMS.value
    )


class ContentFileSerializer(serializers.ModelSerializer):
    """
    Serializer class for course run ContentFiles
    """

    run_id = serializers.CharField(source="run.run_id")
    run_title = serializers.CharField(source="run.title")
    run_slug = serializers.CharField(source="run.slug")
    semester = serializers.CharField(source="run.semester")
    year = serializers.IntegerField(source="run.year")
    topics = LearningResourceTopicsField(source="run.learning_resource.topics")
    short_description = serializers.CharField(source="description")
    resource_id = serializers.CharField(source="run.learning_resource.id")
    department = serializers.CharField(source="run.learning_resource.department")
    resource_readable_id = serializers.CharField(
        source="run.learning_resource.readable_id"
    )
    resource_readable_num = serializers.CharField(
        source="run.learning_resource.resource_num"
    )
    resource_type = serializers.SerializerMethodField()

    def get_resource_type(self, instance):  # noqa: ARG002
        """
        Get the resource type of the ContentFile. For now, just return None.
        NOTE: This function needs to be updated once OCW courses are added.
        """
        return

    class Meta:
        model = models.ContentFile
        fields = [
            "id",
            "run_id",
            "run_title",
            "run_slug",
            "department",
            "semester",
            "year",
            "topics",
            "key",
            "uid",
            "title",
            "short_description",
            "url",
            "short_url",
            "section",
            "section_slug",
            "file_type",
            "content_type",
            "content",
            "content_title",
            "content_author",
            "content_language",
            "image_src",
            "resource_id",
            "resource_readable_id",
            "resource_readable_num",
            "resource_type",
        ]


class UserListSerializer(serializers.ModelSerializer, WriteableTopicsMixin):
    """
    Simplified serializer for UserList model.
    """

    item_count = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    def get_image(self, instance) -> dict:
        """Return the image of the first item"""
        list_item = instance.children.order_by("position").first()
        if list_item and list_item.child.image:
            return LearningResourceImageSerializer(instance=list_item.child.image).data
        return None

    def get_item_count(self, instance) -> int:
        """Return the number of items in the list"""
        return getattr(instance, "item_count", None) or instance.resources.count()

    def create(self, validated_data):
        """Create a new user list"""
        request = self.context.get("request")
        if request and hasattr(request, "user") and isinstance(request.user, User):
            validated_data["author"] = request.user
            topics_data = validated_data.pop("topics", [])
            with transaction.atomic():
                userlist = super().create(validated_data)
                userlist.topics.set(
                    models.LearningResourceTopic.objects.filter(id__in=topics_data)
                )
            return userlist
        return None

    def update(self, instance, validated_data):
        """Update an existing user list"""
        request = self.context.get("request")
        validated_data["author"] = request.user
        topics_data = validated_data.pop("topics", None)
        with transaction.atomic():
            userlist = super().update(instance, validated_data)
            if topics_data is not None:
                userlist.topics.set(
                    models.LearningResourceTopic.objects.filter(id__in=topics_data)
                )
            return userlist

    class Meta:
        model = models.UserList
        exclude = ("resources", *COMMON_IGNORED_FIELDS)
        read_only_fields = ["author"]


class UserListRelationshipSerializer(serializers.ModelSerializer):
    """
    Serializer for UserListRelationship model
    """

    resource = LearningResourceSerializer(read_only=True, source="child")

    def create(self, validated_data):
        user_list = validated_data["parent"]
        items = models.UserListRelationship.objects.filter(parent=user_list)
        position = (
            items.aggregate(Max("position"))["position__max"] or items.count()
        ) + 1
        item, _ = models.UserListRelationship.objects.get_or_create(
            parent=validated_data["parent"],
            child=validated_data["child"],
            defaults={"position": position},
        )
        return item

    def update(self, instance, validated_data):
        position = validated_data["position"]
        with transaction.atomic():
            if position > instance.position:
                # move items between old & new positions up, inclusive of new position
                models.UserListRelationship.objects.filter(
                    position__lte=position, position__gt=instance.position
                ).update(position=F("position") - 1)
            else:
                models.UserListRelationship.objects.filter(
                    position__lt=instance.position, position__gte=position
                ).update(position=F("position") + 1)
            instance.position = position
            instance.save()

        return instance

    class Meta:
        model = models.UserListRelationship
        extra_kwargs = {"position": {"required": False}}
        exclude = COMMON_IGNORED_FIELDS
