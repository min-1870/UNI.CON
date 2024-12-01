from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from .models import User, School
from randomname import get_name
import random
import re
from django.utils import timezone
from .methods import get_school_from_email

class UserSerializer(serializers.ModelSerializer):    
    class Meta:
        model = User
        fields = ['password', 'email']
        extra_kwargs = {
            'email': {'required': True, 'allow_blank': False},
            'password': {'required': True, 'allow_blank': False, 'write_only': True},
        }

    def validate(self, data):
        
        pattern = r'^[\w\.-]+@[\w\.-]+\.edu[\w\.-]+$'
        school = get_school_from_email(data["email"])
        
        if not re.match(pattern, data["email"]):
            raise serializers.ValidationError("Invalid email")
        
        if not school:
            raise serializers.ValidationError("Invalid school")
        
        if len(data['password']) < 8:
            raise serializers.ValidationError("Invalid password")
        
        return data

    def create(self, validated_data):
        
        school = get_school_from_email(validated_data['email'])

        usernames = User.objects.values_list("username")    

        loop = True
        while loop:
            username = get_name()
            if username not in usernames:
                loop = False
        
        validated_data['password'] = make_password(validated_data['password'])
        validated_data['last_login'] = timezone.now()
        validated_data['username'] = username
        validated_data['validation_code'] = str(random.randint(100000, 999999))        
        validated_data['school'] = School.objects.get(id = school['id'])           

        user = User.objects.create(**validated_data)
        return user
    
    
