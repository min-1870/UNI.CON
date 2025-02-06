from rest_framework_simplejwt.tokens import RefreshToken
from community.utils import get_current_user_points
from .models import School
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from decouple import config

def send_otp(otp, email):

    unicon_email = config("UNICON_EMAIL")
    unicon_password = config("UNICON_EMAIL_PASSWORD")

    # Email details
    subject = "Your OTP for UNI.CON is here!"
    body = "Your OTP is " + str(otp) + ". Please do not share it with anyone."

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



def get_school_id_from_email(email):
    schools = School.objects.values_list("id", "email_identifier")
    for pk, email_identifier in schools:
        if email_identifier in email[email.index("@") :]:  # noqa
            return pk
    return False


def annotate_user(user_instance):
    user_instance.initial = user_instance.school.initial
    user_instance.color = user_instance.school.color
    user_instance.points = get_current_user_points(user_instance.id)
    user_instance.refresh = RefreshToken.for_user(user_instance)
    user_instance.access = RefreshToken.for_user(user_instance).access_token
    return user_instance
