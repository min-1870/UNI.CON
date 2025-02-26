from community.constants import (
    CACHE_TIMEOUT,
    PAGINATOR_SIZE,
    NOTIFICATIONS_CACHE_KEY,
    NOTIFICATION_EMAIL_BODY,
    NOTIFICATION_EMAIL_SUBJECT,
    NOTIFICATION_GROUP_KV
)

from django.db.models import OuterRef, Subquery, Case, When, Value, F
from .response_serializers import NotificationResponseSerializer
from community.models import  Notification, Article, Comment
from django.contrib.contenttypes.models import ContentType
from django.db.models.functions import Coalesce
from django.core.cache import cache
from django.db import transaction
from django.db import models
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from decouple import config
import smtplib

def get_paginated_notifications(request):
    try:
        requested_page = int(request.query_params.get("page", 1))
    except Exception:
        requested_page = 0
    user_instance = request.user

    # Cache notifications
    cache_key = NOTIFICATIONS_CACHE_KEY(
        user_instance.id
    )
    notifications_cache = cache.get(cache_key)

    # Initiate the cache if the cache is missing
    if notifications_cache is None:
        total_notifications = (
            Notification.objects.filter(user=user_instance).count()
        )
        notifications_cache = {
            "total_notifications": total_notifications,
            "notifications": {}
        }
        cache.set(cache_key, notifications_cache, CACHE_TIMEOUT)

    if notifications_cache["total_notifications"] == 0:
        return {
            "count": 0,
            "next": None,
            "results": {"notifications": []},
        }

    # Fetch notifications if the cache does not have enough notifications
    if len(notifications_cache["notifications"]) < requested_page * PAGINATOR_SIZE:
        start_index = len(notifications_cache["notifications"])
        end_index = requested_page * PAGINATOR_SIZE
        notification_queryset = (
            Notification.objects.filter(user=user_instance).annotate(
                content=Coalesce(
                    Case(
                        # If content_type is "article", get the title from Article
                        When(
                            content_type__model="article",
                            then=Subquery(Article.objects.filter(id=OuterRef("object_id")).values("title")[:1])
                        ),
                        # If content_type is "comment", get the body from Comment
                        When(
                            content_type__model="comment",
                            then=Subquery(Comment.objects.filter(id=OuterRef("object_id")).values("body")[:1])
                        ),
                        default=Value("Unknown"),  # Default value if no match
                        output_field=models.CharField(),
                    ),
                    Value("Unknown") 
                ),
                type_name=F("content_type__model")
            ).order_by("-created_at")[start_index:end_index]
        )
        with transaction.atomic():
            Notification.objects.filter(id__in=[n.id for n in notification_queryset]).update(read=True)

        # Serialize and set the cache
        new_serialized_notifications = NotificationResponseSerializer(
            notification_queryset, many=True
        ).data
        new_serialized_notifications = {
            notification["id"]: notification for notification in new_serialized_notifications
        }
        notifications_cache["notifications"].update(new_serialized_notifications)
        cache.set(cache_key, notifications_cache, CACHE_TIMEOUT)

    # Slice the notifications that user requested only
    start_index = (requested_page - 1) * 10
    end_index = start_index + PAGINATOR_SIZE
    serialized_notifications = list(notifications_cache["notifications"].values())[start_index:end_index]

    # Construct the response data with necessary pagination attributes
    url = request.build_absolute_uri()
    if end_index < notifications_cache["total_notifications"]:
        next_page = f"{url.split('?')[0]}?page={requested_page + 1}"
    else:
        next_page = None

    return {
        "count": notifications_cache["total_notifications"],
        "next": next_page,
        "results": {"notifications": serialized_notifications},
    }


def add_notification(notification_type, user_instance, model_class, object_id):

    with transaction.atomic():
        notification = Notification.objects.create(
            group=notification_type,
            user=user_instance, 
            content_type=ContentType.objects.get_for_model(model_class),
            object_id=object_id,
            read=False
        )
    
    notification.content = getattr(
        notification.source,
        "title", 
        getattr(
                notification.source, "body", None
        )
    )
    notification.type_name = notification.content_type.model
    serialized_notification = NotificationResponseSerializer(
            notification
    ).data

    unicon_email = config("UNICON_EMAIL")
    unicon_password = config("UNICON_EMAIL_PASSWORD")

    # Create email message
    msg = MIMEMultipart()
    msg["From"] = unicon_email
    msg["To"] = user_instance.email
    msg["Subject"] = NOTIFICATION_EMAIL_SUBJECT
    email_body = NOTIFICATION_EMAIL_BODY(
        serialized_notification["type_name"],
        serialized_notification["content"],
        NOTIFICATION_GROUP_KV[serialized_notification["group"]]
    )
    print(email_body)
    msg.attach(MIMEText(email_body, "plain"))

    try:
        # Connect to Gmail SMTP server
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(unicon_email, unicon_password)
        server.sendmail(unicon_email, user_instance.email, msg.as_string())
        server.quit()
        
    except Exception as e:
        print("Error:", e)

    # Cache notifications
    cache_key = NOTIFICATIONS_CACHE_KEY(
        user_instance.id
    )
    notifications_cache = cache.get(cache_key)

    # Initiate the cache if the cache is missing
    if notifications_cache:
        notifications_cache["total_notifications"] += 1
        
        # Insert the notification at the beginning of cache
        notifications = {serialized_notification["id"]: serialized_notification}
        notifications.update(notifications_cache["notifications"])
        notifications_cache["notifications"] = notifications
        cache.set(cache_key, notifications_cache, CACHE_TIMEOUT)