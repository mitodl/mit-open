"""Tests for content_files serializers"""
import pytest

from learning_resources import constants, factories, serializers
from open_discussions.test_utils import assert_json_equal

pytestmark = pytest.mark.django_db


def test_content_file_serializer():
    """Verify that the ContentFileSerializer has the correct data"""
    content_kwargs = {
        "content": "Test content",
        "content_author": "MIT",
        "content_language": "en",
        "content_title": "test title",
        "section": "test section",
    }
    platform = constants.PlatformType.xpro.value
    course = factories.CourseFactory.create(platform=platform)
    content_file = factories.ContentFileFactory.create(
        run=course.learning_resource.runs.first(), **content_kwargs
    )

    serialized = serializers.ContentFileSerializer(content_file).data

    assert_json_equal(
        serialized,
        {
            "id": content_file.id,
            "run_id": content_file.run.run_id,
            "run_title": content_file.run.title,
            "run_slug": content_file.run.slug,
            "departments": [
                {"name": dept.name, "department_id": dept.department_id}
                for dept in content_file.run.learning_resource.departments.all()
            ],
            "semester": content_file.run.semester,
            "year": int(content_file.run.year),
            "topics": [
                {"name": topic.name, "id": topic.id}
                for topic in content_file.run.learning_resource.topics.all()
            ],
            "key": content_file.key,
            "uid": content_file.uid,
            "title": content_file.title,
            "description": content_file.description,
            "file_type": content_file.file_type,
            "content_type": content_file.content_type,
            "url": content_file.url,
            "short_url": content_file.short_url,
            "section": content_file.section,
            "section_slug": content_file.section_slug,
            "content": content_kwargs["content"],
            "content_title": content_kwargs["content_title"],
            "content_author": content_kwargs["content_author"],
            "content_language": content_kwargs["content_language"],
            "image_src": content_file.image_src,
            "resource_id": str(content_file.run.learning_resource.id),
            "resource_readable_id": content_file.run.learning_resource.readable_id,
            "resource_readable_num": content_file.run.learning_resource.readable_id.split(
                "+"
            )[-1],
            "content_category": None,
        },
    )
