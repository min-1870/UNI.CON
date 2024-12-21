from rest_framework_simplejwt.tokens import RefreshToken
from community.database_utils import get_current_user_points
from .models import School


def send_otp():
    pass


def get_school_from_email(email):
    schools = School.objects.values_list("id", "name", "initial")
    for id, name, initial in schools:
        if initial in email[email.index("@") :]:
            return {"id": id, "name": name, "initial": initial}
    return False


def annotate_user(user_instance):
    user_instance.initial = user_instance.school.initial
    user_instance.color = user_instance.school.color
    user_instance.points = get_current_user_points(user_instance.id)
    user_instance.refresh = RefreshToken.for_user(user_instance)
    user_instance.access = RefreshToken.for_user(user_instance).access_token
    return user_instance
