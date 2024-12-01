from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class School(models.Model):
    name = models.CharField(max_length=200, default="unknown", null=False)
    color = models.CharField(max_length=7, default="#000000", null=False)
    initial = models.CharField(max_length=10, default="unknown", null=False)

class User(AbstractUser):
    email = models.CharField(max_length=254, default="unknown", null= False, unique=True)
    validation_code = models.CharField(max_length=6, default="000000", null=False)
    points = models.BigIntegerField(default=100, null=False)
    is_validated = models.BooleanField(default=False, null=False)
    is_active = models.BooleanField(default=True, null=False)
    is_staff = models.BooleanField(default=False, null=False)
    is_superuser = models.BooleanField(default=False, null=False)
    date_joined = models.DateTimeField(default=timezone.now, null=False)
    school = models.ForeignKey(School, on_delete=models.CASCADE, null=True)
    
class TimeTable(models.Model):
    user_id = models.ForeignKey(User, to_field='id', db_column='user_id', on_delete=models.CASCADE)
    class_name = models.CharField(max_length=200)
    start_time = models.TimeField()
    end_time = models.TimeField()
    date = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(6)])
    
    
    