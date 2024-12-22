from django.contrib.auth.hashers import make_password
from .helpers import get_school_from_email, annotate_user
from rest_framework import serializers
from .models import User, School
from django.utils import timezone
import random
import re


class UserSerializer(serializers.ModelSerializer):
    initial = serializers.CharField(read_only=True)
    color = serializers.CharField(read_only=True)
    points = serializers.IntegerField(read_only=True)
    refresh = serializers.CharField(read_only=True)
    access = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "password",
            "email",
            "validation_code",
            "initial",
            "color",
            "points",
            "refresh",
            "access",
            "is_validated",
        ]
        extra_kwargs = {
            "email": {"required": True, "allow_blank": False},
            "password": {"required": True, "allow_blank": False, "write_only": True},
            "validation_code": {
                "required": False,
                "allow_blank": False,
                "write_only": True,
            },
        }

    def validate(self, data):

        pattern = r"^[\w\.-]+@[\w\.-]+\.edu[\w\.-]+$"
        school = get_school_from_email(data["email"])

        if not re.match(pattern, data["email"]):
            raise serializers.ValidationError("Invalid email")

        if not school:
            raise serializers.ValidationError("Invalid school")

        if len(data["password"]) < 8:
            raise serializers.ValidationError("Invalid password")

        return data

    def create(self, validated_data):

        school = get_school_from_email(validated_data["email"])

        validated_data["password"] = make_password(validated_data["password"])
        validated_data["last_login"] = timezone.now()
        validated_data["validation_code"] = str(random.randint(100000, 999999))
        validated_data["username"] = validated_data["email"]
        validated_data["school"] = School.objects.get(id=school["id"])

        user_instance = User.objects.create(**validated_data)

        user_instance = annotate_user(user_instance)

        return user_instance
