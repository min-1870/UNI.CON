from community.constants import (
    CACHE_TIMEOUT,
    PAGINATOR_SIZE,
    NOTIFICATIONS_CACHE_KEY,
    EMAIL_NOTIFICATIONS_THRESHOLD,
)
from community.task import send_email
from django.db.models import OuterRef, Subquery, Case, When, Value, F
from .response_serializers import NotificationResponseSerializer
from community.models import  Notification, Article, Comment
from django.contrib.contenttypes.models import ContentType
from django.db.models.functions import Coalesce
from django.core.cache import cache
from django.db import transaction
from django.db import models

def get_paginated_notifications(request, new=False):
    if new:
        return get_paginated_new_notifications(request)
    else:
        return get_paginated_read_notifications(request)

def get_paginated_new_notifications(request):
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
        total_notifications = Notification.objects.filter(user=user_instance, read=True).count()
        unaware_notifications = list(Notification.objects.filter(user=user_instance, read=False, email=False).values_list('id', flat=True))
        notifications_cache = {
            "total_notifications": total_notifications,
            "unaware_notifications": unaware_notifications,
            "notifications": {}
        }

    total_notifications = Notification.objects.filter(user=user_instance, read=False).count()

    start_index = (requested_page - 1) * PAGINATOR_SIZE
    end_index = requested_page * PAGINATOR_SIZE
    
    notification_queryset = (
        Notification.objects.filter(user=user_instance, read=False).annotate(
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

    read_notification_ids = list(notification_queryset.values_list('id', flat=True))
    with transaction.atomic():
        Notification.objects.filter(id__in=read_notification_ids).update(read=True)

    notifications_cache["total_notifications"] += len(notification_queryset)
    notifications_cache["unaware_notifications"] = [nid for nid in notifications_cache["unaware_notifications"] if nid not in read_notification_ids]
    cache.set(cache_key, notifications_cache, CACHE_TIMEOUT)

    serialized_notifications = NotificationResponseSerializer(
        notification_queryset, many=True
    ).data

    # Construct the response data with necessary pagination attributes
    url = request.build_absolute_uri()
    if end_index < total_notifications:
        next_page = f"{url.split('?')[0]}?page={requested_page + 1}"
    else:
        next_page = None

    return {
        "count": total_notifications,
        "next": next_page,
        "results": {"notifications": serialized_notifications},
    }


def get_paginated_read_notifications(request):
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
        total_notifications = Notification.objects.filter(user=user_instance, read=True).count()
        unaware_notifications = list(Notification.objects.filter(user=user_instance, read=False, email=False).values_list('id', flat=True))
        notifications_cache = {
            "total_notifications": total_notifications,
            "unaware_notifications": unaware_notifications,
            "notifications": {}
        }

    if notifications_cache["total_notifications"] == 0:
        cache.set(cache_key, notifications_cache, CACHE_TIMEOUT)
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
            Notification.objects.filter(user=user_instance, read=True).annotate(
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

        # Serialize and update the cache with the new notifications
        new_serialized_notifications = NotificationResponseSerializer(
            notification_queryset, many=True
        ).data
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

    # Create the notification in the database
    with transaction.atomic():
        notification = Notification.objects.create(
            group=notification_type,
            user=user_instance, 
            content_type=ContentType.objects.get_for_model(model_class),
            object_id=object_id,
            read=False,
            email=False
        )
    
    # Cache notifications
    cache_key = NOTIFICATIONS_CACHE_KEY(
        user_instance.id
    )
    serialized_notifications = cache.get(cache_key)
    if serialized_notifications is None:
        total_notifications = Notification.objects.filter(user=user_instance, read=True).count()
        unaware_notifications = list(Notification.objects.filter(user=user_instance, read=False, email=False).values_list('id', flat=True))
        serialized_notifications = {
            "total_notifications": total_notifications,
            "unaware_notifications": unaware_notifications,
            "notifications": {}
        }

    # Update the cache with the new notification
    serialized_notifications["unaware_notifications"].insert(0, notification.id)

    # Check if the user needs to be notified via email
    if len(serialized_notifications["unaware_notifications"]) >= EMAIL_NOTIFICATIONS_THRESHOLD:

        # Fetch the notifications that have not been emailed
        notification_queryset = Notification.objects.filter(user=user_instance, read=False, email=False).annotate(
            content=Coalesce(
                Case(
                    When(
                        content_type__model="article",
                        then=Subquery(Article.objects.filter(id=OuterRef("object_id")).values("title")[:1])
                    ),
                    When(
                        content_type__model="comment",
                        then=Subquery(Comment.objects.filter(id=OuterRef("object_id")).values("body")[:1])
                    ),
                    default=Value("Unknown"),
                    output_field=models.CharField(),
                ),
                Value("Unknown")
            ),
            type_name=F("content_type__model")
        ).order_by("-created_at")

        # Send the email
        email_body = str(notification_queryset.values_list('id', flat=True))
        send_email.delay(
            email_body,
            user_instance.email
        )

        # Update the database to mark the notifications as emailed
        with transaction.atomic():
            Notification.objects.filter(id__in=notification_queryset.values_list('id', flat=True)).update(email=True)
        
        # Update the cache
        serialized_notifications["unaware_notifications"] = []
    
    cache.set(cache_key, serialized_notifications, CACHE_TIMEOUT)
    