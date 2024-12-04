# Generated by Django 5.0.4 on 2024-12-03 14:19

import account.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='embedding_vector',
            field=models.JSONField(default=account.models.default_embedding_vectors),
        ),
    ]