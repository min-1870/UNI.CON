# Generated by Django 5.0.4 on 2024-12-01 11:51

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('community', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='articletag',
            name='article',
        ),
        migrations.RemoveField(
            model_name='articletag',
            name='tag',
        ),
        migrations.DeleteModel(
            name='Tag',
        ),
        migrations.DeleteModel(
            name='ArticleTag',
        ),
    ]
