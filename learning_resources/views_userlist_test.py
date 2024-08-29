"""Tests for learning_resources UserList views"""

import pytest
from django.urls import reverse

from learning_resources import factories
from learning_resources.constants import PrivacyLevel
from learning_resources.models import UserList, UserListRelationship
from main.factories import UserFactory

# pylint:disable=redefined-outer-name, use-maxsplit-arg


@pytest.mark.parametrize("is_author", [True, False])
@pytest.mark.parametrize("has_image", [True, False])
@pytest.mark.parametrize("is_unlisted", [True, False])
def test_user_list_endpoint_get(client, user, is_author, has_image, is_unlisted):
    """Test learning path endpoint"""
    author = UserFactory.create()
    user_list = factories.UserListFactory.create(author=author)

    another_user_list = factories.UserListFactory.create(
        author=UserFactory.create(),
        privacy_level=(
            PrivacyLevel.unlisted.value if is_unlisted else PrivacyLevel.private.value
        ),
    )

    first_item = factories.UserListRelationshipFactory.create(
        parent=user_list, position=1
    )
    factories.UserListRelationshipFactory.create(parent=user_list, position=2)

    first_resource = first_item.child
    if not has_image:
        first_resource.image = None
        first_resource.save()
        image_url = None
    else:
        image_url = first_resource.image.url

    # Anonymous users should get empty results
    resp = client.get(reverse("lr:v1:userlists_api-list"))
    assert resp.data.get("count") == 0

    # Logged in user should get own lists only
    client.force_login(author if is_author else user)
    resp = client.get(reverse("lr:v1:userlists_api-list"))
    assert resp.data.get("count") == (1 if is_author else 0)

    # Only author should get details of own private list
    resp = client.get(reverse("lr:v1:userlists_api-detail", args=[user_list.id]))
    assert resp.status_code == (404 if not is_author else 200)
    if resp.status_code == 200:
        assert resp.data.get("title") == user_list.title
        assert resp.data.get("item_count") == 2
        if has_image:
            assert resp.data.get("image").get("url") == image_url
        else:
            assert resp.data.get("image") is None
    # Author should get details of another user's list only if privacy is unlisted
    resp = client.get(
        reverse("lr:v1:userlists_api-detail", args=[another_user_list.id])
    )
    assert resp.status_code == 404 if not is_unlisted else 200


@pytest.mark.parametrize("is_anonymous", [True, False])
def test_user_list_endpoint_create(  # pylint: disable=too-many-arguments
    client, is_anonymous
):
    """Test userlist endpoint for creating a UserList"""
    user = UserFactory.create()
    if not is_anonymous:
        client.force_login(user)

    data = {"title": "My List"}

    resp = client.post(reverse("lr:v1:userlists_api-list"), data=data, format="json")
    assert resp.status_code == (403 if is_anonymous else 201)
    if resp.status_code == 201:
        assert resp.data.get("title") == resp.data.get("title")
        assert resp.data.get("author") == user.id


@pytest.mark.parametrize("update_topics", [True, False])
def test_user_list_endpoint_patch(client, update_topics):
    """Test userlist endpoint for updating a UserList"""
    [original_topic, new_topic] = factories.LearningResourceTopicFactory.create_batch(2)
    list_user = UserFactory.create()
    userlist = factories.UserListFactory.create(
        author=list_user,
        title="Title 1",
        topics=[original_topic],
    )
    factories.UserListRelationshipFactory.create(parent=userlist)

    client.force_login(list_user)

    data = {"title": "Title 2"}
    if update_topics:
        data["topics"] = [new_topic.id]

    resp = client.patch(
        reverse("lr:v1:userlists_api-detail", args=[userlist.id]),
        data=data,
        format="json",
    )
    assert resp.data["title"] == "Title 2"
    assert resp.data["topics"][0]["id"] == (
        new_topic.id if update_topics else original_topic.id
    )


@pytest.mark.parametrize("is_author", [True, False])
def test_user_list_items_endpoint_create_item(client, user, is_author):
    """Test userlistitems endpoint for creating a UserListItem"""
    author = UserFactory.create()
    userlist = factories.UserListFactory.create(author=author)
    course = factories.CourseFactory.create()

    client.force_login(author if is_author else user)

    data = {"child": course.learning_resource.id}

    resp = client.post(
        reverse("lr:v1:userlistitems_api-list", args=[userlist.id]),
        data=data,
        format="json",
    )
    assert resp.status_code == (201 if is_author else 403)
    if resp.status_code == 201:
        assert resp.json().get("child") == course.learning_resource.id


def test_user_list_items_endpoint_create_item_bad_data(client, user):
    """Test userlistitems endpoint for creating a UserListRelationship with bad data"""
    userlist = factories.UserListFactory.create(author=user)

    client.force_login(user)

    data = {"child": 999}

    resp = client.post(
        reverse("lr:v1:userlistitems_api-list", args=[userlist.id]),
        data=data,
        format="json",
    )
    assert resp.status_code == 400
    assert resp.json() == {
        "child": ['Invalid pk "999" - object does not exist.'],
        "error_type": "ValidationError",
    }


@pytest.mark.parametrize(
    ("is_author", "position"),
    [[True, 0], [True, 2], [False, 1]],  # noqa: PT007
)
def test_user_list_items_endpoint_update_item(client, user, is_author, position):
    """Test userlistitems endpoint for updating UserListRelationship positions"""
    author = UserFactory.create()
    topics = factories.LearningResourceTopicFactory.create_batch(3)
    userlist = factories.UserListFactory.create(author=author, topics=topics)
    list_item_1 = factories.UserListRelationshipFactory.create(
        parent=userlist, position=0
    )
    list_item_2 = factories.UserListRelationshipFactory.create(
        parent=userlist, position=1
    )
    list_item_3 = factories.UserListRelationshipFactory.create(
        parent=userlist, position=2
    )

    client.force_login(author if is_author else user)

    data = {"position": position}

    resp = client.patch(
        reverse("lr:v1:userlistitems_api-detail", args=[userlist.id, list_item_2.id]),
        data=data,
        format="json",
    )
    assert resp.status_code == (200 if is_author else 403)
    if resp.status_code == 200:
        for item, expected_pos in (
            [list_item_3, 1 if position == 2 else 2],
            [list_item_1, 0 if position == 2 else 1],
            [list_item_2, position],
        ):
            item.refresh_from_db()
            assert item.position == expected_pos


def test_user_list_items_endpoint_update_items_wrong_list(client, user):
    """Verify that trying an update via userlistitems api in wrong list fails"""
    userlist = factories.UserListFactory.create(author=user)
    list_item_incorrect = factories.UserListRelationshipFactory.create()

    client.force_login(user)

    data = {"id": list_item_incorrect.id, "position": 44}

    resp = client.patch(
        reverse(
            "lr:v1:userlistitems_api-detail", args=[userlist.id, list_item_incorrect.id]
        ),
        data=data,
        format="json",
    )
    assert resp.status_code == 404


@pytest.mark.parametrize("is_author", [True, False])
def test_user_list_items_endpoint_delete_items(client, user, is_author):
    """Test userlistitems endpoint for deleting UserListItems"""
    author = UserFactory.create()
    userlist = factories.UserListFactory.create(author=author)
    list_items = sorted(
        factories.UserListRelationshipFactory.create_batch(2, parent=userlist),
        key=lambda item: item.id,
    )

    client.force_login(author if is_author else user)

    resp = client.delete(
        reverse("lr:v1:userlistitems_api-detail", args=[userlist.id, list_items[0].id]),
        format="json",
    )
    assert resp.status_code == (204 if is_author else 403)
    if resp.status_code == 204:
        client.delete(
            reverse(
                "lr:v1:userlistitems_api-detail", args=[userlist.id, list_items[0].id]
            ),
            format="json",
        )
        for item in list_items[1:]:
            old_position = item.position
            item.refresh_from_db()
            assert item.position == (old_position - 1)


@pytest.mark.parametrize("is_author", [True, False])
def test_user_list_endpoint_delete(client, user, is_author):
    """Test userlist endpoint for deleting a UserList"""
    author = UserFactory.create()
    userlist = factories.UserListFactory.create(author=author)

    client.force_login(author if is_author else user)

    resp = client.delete(reverse("lr:v1:userlists_api-detail", args=[userlist.id]))
    assert resp.status_code == (204 if is_author else 403)
    assert UserList.objects.filter(id=userlist.id).exists() is not is_author


@pytest.mark.parametrize("is_author", [True, False])
@pytest.mark.parametrize("is_unlisted", [True, False])
def test_get_resource_user_lists(client, user, is_author, is_unlisted):
    """Test course detail endpoint"""
    course = factories.CourseFactory.create()
    userlist = factories.UserListFactory.create(
        author=user if is_author else UserFactory.create(),
        privacy_level=(
            PrivacyLevel.unlisted.value if is_unlisted else PrivacyLevel.private.value
        ),
    )
    path_items = sorted(
        factories.UserListRelationshipFactory.create_batch(
            3, child=course.learning_resource, parent=userlist
        ),
        key=lambda item: item.position,
    )
    resp = client.get(
        reverse("lr:v1:courses_api-detail", args=[course.learning_resource.id])
    )

    items_json = resp.data.get("user_list_parents")
    if is_author:
        for idx, item in items_json:
            assert item.get("id") == path_items[idx].id
            assert item.get("position") == path_items[idx].position
            assert item.get("child") == course.learning_resource.id
    else:
        assert items_json == []


def test_set_userlist_relationships(client, user):
    """Test the userlists endpoint for setting multiple userlist relationships"""
    course = factories.CourseFactory.create()
    userlists = factories.UserListFactory.create_batch(3, author=user)
    previous_list = factories.UserListFactory.create(author=user)
    factories.UserListRelationshipFactory.create(
        parent=previous_list, child=course.learning_resource
    )
    url = reverse(
        "lr:v1:learning_resource_relationships_api-userlists",
        args=[course.learning_resource.id],
    )
    client.force_login(user)
    resp = client.patch(
        f"{url}?{"".join([f"userlist_id={userlist.id}&" for userlist in userlists])}"
    )
    assert resp.status_code == 200
    for userlist in userlists:
        assert userlist.resources.filter(id=course.learning_resource.id).exists()
    assert not previous_list.resources.filter(id=course.learning_resource.id).exists()


def test_set_userlist_relationships_unauthorized(client, user):
    """Test the userlists endpoint for unauthorized users"""
    course = factories.CourseFactory.create()
    userlists = factories.UserListFactory.create_batch(3)
    url = reverse(
        "lr:v1:learning_resource_relationships_api-userlists",
        args=[course.learning_resource.id],
    )
    client.force_login(user)
    with pytest.raises(PermissionError):
        client.patch(
            f"{url}?{"".join([f"userlist_id={userlist.id}&" for userlist in userlists])}"
        )
    for userlist in userlists:
        assert not userlist.resources.filter(id=course.learning_resource.id).exists()


def test_set_userlist_relationships_empty_list(client, user):
    """Test that sending an empty list in the request does not unassign the wrong userlists"""

    def assign_userlists(userlists):
        for userlist in userlists:
            factories.UserListRelationshipFactory.create(
                parent=userlist, child=course.learning_resource
            )

    course = factories.CourseFactory.create()
    unowned_userlists = factories.UserListFactory.create_batch(3)
    owned_userlists = factories.UserListFactory.create_batch(3, author=user)
    assign_userlists(unowned_userlists)
    assign_userlists(owned_userlists)
    assert (
        UserListRelationship.objects.filter(child=course.learning_resource).count() == 6
    )
    url = reverse(
        "lr:v1:learning_resource_relationships_api-userlists",
        args=[course.learning_resource.id],
    )
    client.force_login(user)
    client.patch(url)
    assert (
        UserListRelationship.objects.filter(child=course.learning_resource).count() == 3
    )
