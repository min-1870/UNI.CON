from .constants import (
    VALIDATION_CODE_LENGTH,
    VALIDATION_CODE_CACHE_KEY,
    TEMPORARY_CODE_LIFETIME,
    OTP_EMAIL_SUBJECT,
    OTP_EMAIL_BODY
)
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.cache import cache
from account.tasks import send_email
from account.models import School
from decouple import config
import requests
import random
import jwt



def annotate_user(user_instance):
    university_colors = {item["initial"]: item["color"] for item in School.objects.values("color", "initial").distinct()}
    user_instance.university_colors = university_colors
    user_instance.university = user_instance.school.name
    user_instance.initial = user_instance.school.initial
    user_instance.color = user_instance.school.color
    user_instance.refresh = RefreshToken.for_user(user_instance)
    user_instance.access = RefreshToken.for_user(user_instance).access_token
    return user_instance


def send_validation_code_email(user_instance):
    validation_code = "".join(str(random.randint(0, 9)) for _ in range(VALIDATION_CODE_LENGTH))
    cache.set(VALIDATION_CODE_CACHE_KEY(user_instance.id), validation_code, timeout=TEMPORARY_CODE_LIFETIME)
    send_email.delay(
        OTP_EMAIL_SUBJECT,
        OTP_EMAIL_BODY + validation_code,
        user_instance.email
    )


def match_validation_code(user_instance, code):
    cached_code = cache.get(VALIDATION_CODE_CACHE_KEY(user_instance.id))
    if cached_code == code:
        # If the code matches, delete it from the cache
        cache.delete(VALIDATION_CODE_CACHE_KEY(user_instance.id))
        return True
    return False


def exchange_google_code_for_data(redirect_uri, code, code_verifier):
    data = {
        "code": code,
        "client_id": config("GOOGLE_CLIENT_ID"),
        "client_secret": config("GOOGLE_CLIENT_SECRET"),
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
        "code_verifier": code_verifier,    
    }
            
    response = requests.post(config("GOOGLE_TOKEN_URI"), data=data)
    # print("TOKEN RESPONSE:", response.status_code, response.text)
    token_data = response.json()
    if "id_token" in token_data:
        decoded_token = jwt.decode(
            token_data.get("id_token"),
            options={"verify_signature": False},
            algorithms=["RS256"], 
        ) 
        
        return decoded_token
    else:
        return {}


def get_school_id_from_email(email):
    schools = School.objects.values_list("id", "email_identifier")
    for pk, email_identifier in schools:
        if email_identifier in email[email.index("@") :]:  # noqa
            return pk
    return False

