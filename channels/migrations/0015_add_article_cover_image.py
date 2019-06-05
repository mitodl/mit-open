# Generated by Django 2.1.2 on 2018-12-18 19:27

from django.db import migrations, models
import open_discussions.utils
import profiles.utils


def article_image_uri_small(instance, filename):
    """
    upload_to handler for Article.cover_image_small
    """
    return open_discussions.utils.generate_filepath(
        filename, instance.post.post_id, "_article_small", "article"
    )


class Migration(migrations.Migration):

    dependencies = [("channels", "0014_add_allowed_post_types")]

    operations = [
        migrations.AddField(
            model_name="article",
            name="cover_image",
            field=models.ImageField(
                blank=True,
                max_length=2083,
                null=True,
                upload_to=profiles.utils.article_image_uri,
            ),
        ),
        migrations.AddField(
            model_name="article",
            name="cover_image_small",
            field=models.ImageField(
                blank=True,
                max_length=2083,
                null=True,
                upload_to=article_image_uri_small,
            ),
        ),
    ]
