from rest_framework_simplejwt.tokens import RefreshToken
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from decouple import config
from .models import School
import requests
import smtplib
import jwt
from django.core.cache import cache
from .constants import VALIDATION_CODE_LENGTH, VALIDATION_CODE_CACHE_KEY, TEMPORARY_CODE_LIFETIME
import random


def get_validation_code(user_instance):
    """
    Store the validation code in the cache for 10 minutes.
    """
    validation_code = "".join(str(random.randint(0, 9)) for _ in range(VALIDATION_CODE_LENGTH))
    cache.set(VALIDATION_CODE_CACHE_KEY(user_instance.id), validation_code, timeout=TEMPORARY_CODE_LIFETIME)
    return validation_code

def match_validation_code(user_instance, code):
    cached_code = cache.get(VALIDATION_CODE_CACHE_KEY(user_instance.id))
    print("Cached Code:", cached_code)
    print("Provided Code:", code, VALIDATION_CODE_CACHE_KEY(user_instance.id))
    if cached_code == code:
        # If the code matches, delete it from the cache
        cache.delete(VALIDATION_CODE_CACHE_KEY(user_instance.id))
        return True
    return False

def send_email(subject, body, email):
    email = '200134kms@gmail.com' # For testing purposes, replace with the actual email address

    unicon_email = config("UNICON_EMAIL")
    unicon_password = config("UNICON_EMAIL_PASSWORD")

    # Create email message
    msg = MIMEMultipart()
    msg["From"] = unicon_email
    msg["To"] = email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        # Connect to Gmail SMTP server
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(unicon_email, unicon_password)
        server.sendmail(unicon_email, email, msg.as_string())
        server.quit()
        
    except Exception as e:
        print("Error:", e)


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
        return None

def get_school_id_from_email(email):
    schools = School.objects.values_list("id", "email_identifier")
    for pk, email_identifier in schools:
        if email_identifier in email[email.index("@") :]:  # noqa
            return pk
    return False


def annotate_user(user_instance, params=None):
    university_colors = {item["initial"]: item["color"] for item in School.objects.values("color", "initial").distinct()}
    university = user_instance.school.name
    initial = user_instance.school.initial
    color = user_instance.school.color
    refresh = RefreshToken.for_user(user_instance)
    access = RefreshToken.for_user(user_instance).access_token
    points = user_instance.points
    if params:
        return f"?user={user_instance.id}&initial={initial}&color={color}&points={points}&refresh={refresh}&access={access}"
    else:
        user_instance.university_colors = university_colors
        user_instance.university = university
        user_instance.initial = initial
        user_instance.color = color
        user_instance.refresh = refresh
        user_instance.access = access
        return user_instance
