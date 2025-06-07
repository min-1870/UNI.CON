from rest_framework_simplejwt.tokens import RefreshToken
from community.utils import get_current_user_points
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from decouple import config
from .models import School
import requests
import smtplib
import jwt

def send_email(subject, body, email):

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
    points = get_current_user_points(user_instance.id)
    refresh = RefreshToken.for_user(user_instance)
    access = RefreshToken.for_user(user_instance).access_token
    if params:
        return f"?user={user_instance.id}&initial={initial}&color={color}&points={points}&refresh={refresh}&access={access}"
    else:
        user_instance.university_colors = university_colors
        user_instance.university = university
        user_instance.initial = initial
        user_instance.color = color
        user_instance.points = points
        user_instance.refresh = refresh
        user_instance.access = access
        return user_instance
