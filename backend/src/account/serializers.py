from .utils import get_school_id_from_email, annotate_user
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from django.utils import timezone
from .models import User
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
            "id": {"read_only": True},
            "email": {"required": True, "allow_blank": False},
            "password": {
                "required": True,
                "allow_blank": False,
                "write_only": True,
                "min_length": 8,
            },
            "validation_code": {"write_only": True, "min_length": 6},
            "validation_code": {
                "required": False,
                "allow_blank": False,
                "write_only": True,
            },
        }

    def validate(self, data):

        pattern = r"^[\w\.-]+@[\w\.-]+\.edu[\w\.-]+$"

        if not re.match(pattern, data["email"]):
            raise serializers.ValidationError("I don't think it is an email..")

        school = get_school_id_from_email(data["email"])

        if not school:
            raise serializers.ValidationError("We do not support the school.")
        data["school"] = school

        if User.objects.filter(email=data["email"]).exists():
            raise serializers.ValidationError("Email is already in use.")

        return data

    def create(self, validated_data):

        validated_data["password"] = make_password(validated_data["password"])
        validated_data["last_login"] = timezone.now()
        validated_data["validation_code"] = str(random.randint(100000, 999999))
        validated_data["username"] = validated_data["email"]

        user_instance = User.objects.create(**validated_data)

        user_instance = annotate_user(user_instance)

        return user_instance
