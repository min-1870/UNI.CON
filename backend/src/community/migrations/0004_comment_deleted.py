# Generated by Django 5.0.4 on 2024-12-03 15:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('community', '0003_article_deleted'),
    ]

    operations = [
        migrations.AddField(
            model_name='comment',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
    ]
