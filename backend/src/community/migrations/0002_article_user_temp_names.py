# Generated by Django 5.0.4 on 2024-08-26 17:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('community', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='article',
            name='user_temp_names',
            field=models.JSONField(default=dict),
        ),
    ]
