from celery import shared_task
from community.constants import (
    NOTIFICATION_EMAIL_BODY,
    NOTIFICATION_EMAIL_SUBJECT,
    NOTIFICATION_GROUP_KV
)
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from decouple import config
import smtplib

@shared_task
def send_email(contents, email):

    unicon_email = config("UNICON_EMAIL")
    unicon_password = config("UNICON_EMAIL_PASSWORD")
    
    # Create email message
    msg = MIMEMultipart()
    msg["From"] = unicon_email
    msg["To"] = "200134kms@gmail.com"
    msg["Subject"] = NOTIFICATION_EMAIL_SUBJECT
    email_body = str(contents)
    
    msg.attach(MIMEText(email_body, "plain"))

    try:
        # Connect to Gmail SMTP server
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(unicon_email, unicon_password)
        server.sendmail(unicon_email, "200134kms@gmail.com", msg.as_string())
        server.quit()
        print("Email sent: ", email_body)
        
    except Exception as e:
        print("Error:", e)
