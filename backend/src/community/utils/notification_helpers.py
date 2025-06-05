from community.constants import (
    
    PAGINATOR_SIZE,
    
    EMAIL_NOTIFICATIONS_THRESHOLD,
    NOTIFICATION_IDS_CACHE_KEY,
    NOTIFICATION_CACHE_KEY,
    
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
from django_redis import get_redis_connection
from django.utils import timezone

redis_conn = get_redis_connection("default")

def to_unix_ms(dt):
    """
    Convert a Django DateTimeField (aware or naive) to an integer
    timestamp in milliseconds.
    """
    if dt:
        if timezone.is_naive(dt):
            dt = dt.replace(tzinfo=timezone.utc)
        return int(dt.timestamp() * 1000)
    else:
        return int(timezone.now().timestamp() * 1000)

def get_paginated_notifications(request, new=True):
    try:
        requested_page = int(request.query_params.get("page", 1))
        dt = request.query_params.get("dt", None)
        
        if timezone.is_naive(dt):
            dt = dt.replace(tzinfo=timezone.utc)
        dt = int(dt.timestamp() * 1000)
    except Exception:
        requested_page = 1
        dt = int(timezone.now().timestamp() * 1000)
    user_instance = request.user

    cache_key = NOTIFICATION_IDS_CACHE_KEY(user_instance.id, new)

    # Check if the zset exists in Redis
    if not redis_conn.exists(cache_key):
        notifications = Notification.objects.filter(user_id=user_instance.id, read=not new).values_list(
            "id", "created_at"
        )
        mapping = {}
        for nid, created_at in notifications:
            score = to_unix_ms(created_at)  
            mapping[str(nid)] = score

        if mapping:
            redis_conn.zadd(cache_key, mapping)
            redis_conn.expire(cache_key, 60 * 24 * 60 * 60)
        
    # Fetch new notification IDs from the cache
    raw_with_scores  = redis_conn.zrevrangebyscore(
        cache_key,
        max=dt,
        min=0,
        start=0,
        num= PAGINATOR_SIZE,
        withscores=True 
    )
    mapping = {member.decode(): int(score) for member, score in raw_with_scores }
    id_list = list(mapping.keys())
    
    # Move the zset ids to old notifications zset
    if new and id_list:
        redis_conn.zrem(cache_key, *id_list)
        old_cache_key = NOTIFICATION_IDS_CACHE_KEY(user_instance.id, False)
        if redis_conn.exists(old_cache_key):
            redis_conn.zadd(old_cache_key, mapping)
        
        with transaction.atomic():
            Notification.objects.filter(id__in=id_list).update(read=True)

    # Bulk get notifications from cache
    cache_keys = [NOTIFICATION_CACHE_KEY(nid) for nid in id_list]
    cached = cache.get_many(cache_keys)

    # Build the results dictionary
    results = {}
    missing_ids = []
    for nid in id_list:
        key = NOTIFICATION_CACHE_KEY(nid)
        serialized_notification = cached.get(key)
        if serialized_notification is None:
            missing_ids.append(nid)
            results[nid] = None
        else:
            results[nid] = serialized_notification

    # If any misses, fetch from DB and re-cache
    if missing_ids:
        queryset = Notification.objects.filter(id__in=missing_ids).annotate(
            title=Coalesce(
                Case(
                    # If content_type is "article", get the title from Article
                    When(
                        content_type__model="article",
                        then=Subquery(
                            Article.objects.filter(
                                id=OuterRef("object_id")
                            ).values("title")[:1]
                        )
                    ),
                    # If content_type is "comment", get the title from Article
                    When(
                        content_type__model="comment",
                        then=Subquery(
                            Comment.objects.filter(
                                id=OuterRef("object_id")
                            ).values("article__title")[:1]
                        )
                    ),
                    default=Value("Unknown"),  # Default value if no match
                    output_field=models.CharField(),
                ),
                Value("Unknown")
            ),
            body=Coalesce(
                Case(
                    # If content_type is "article", get the title from Article
                    When(
                        content_type__model="article",
                        then=Subquery(
                            Article.objects.filter(
                                id=OuterRef("object_id")
                            ).values("body")[:1]
                        )
                    ),
                    # If content_type is "comment", get the body from Comment
                    When(
                        content_type__model="comment",
                        then=Subquery(
                            Comment.objects.filter(
                                id=OuterRef("object_id")
                            ).values("body")[:1]
                        )
                    ),
                    default=Value("Unknown"),  # Default value if no match
                    output_field=models.CharField(),
                ),
                Value("Unknown") 
            ),
            type_name=F("content_type__model")
        )
        serialized_notifications = NotificationResponseSerializer(
            queryset, many=True
        ).data
        serialized_notifications = {NOTIFICATION_CACHE_KEY(str(n["id"])): n for n in serialized_notifications}       
        cache.set_many(serialized_notifications)
        for item in results.items():
            if item[1] == None:
                results[item[0]] = serialized_notifications[NOTIFICATION_CACHE_KEY(item[0])]

    # Construct the response data with necessary pagination attributes
    if len(results.items()) < PAGINATOR_SIZE:
        next_page = None
    else:
        url = request.build_absolute_uri()
        next_page = f"{url.split('?')[0]}?page={requested_page + 1}"
    return {
        "next": next_page,
        "results": {"notifications": results.values()},
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

    cache_key = NOTIFICATION_IDS_CACHE_KEY(
        user_instance.id, True
    )
    
    # If the cache exists, add the new notification ID to the zset
    if redis_conn.exists(cache_key):
        redis_conn.zadd(
            cache_key,
            {str(notification.id): to_unix_ms(notification.created_at)}
        )

    # Check if the user needs to be notified via email
    if redis_conn.zcard(cache_key) % EMAIL_NOTIFICATIONS_THRESHOLD == 0:
        # Fetch the notifications that have not been emailed
        notification_queryset = Notification.objects.filter(
            user=user_instance, 
            read=False,
            email=False
        ).annotate(
            content=Coalesce(
                Case(
                    When(
                        content_type__model="article",
                        then=Subquery(
                            Article.objects.filter(
                                id=OuterRef("object_id")
                            ).values("title")[:1]
                        )
                    ),
                    When(
                        content_type__model="comment",
                        then=Subquery(
                            Comment.objects.filter(
                                id=OuterRef("object_id")
                            ).values("body")[:1]
                        )
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
            Notification.objects.filter(
                id__in=notification_queryset.values_list('id', flat=True)
            ).update(email=True)
    