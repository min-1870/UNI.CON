from account.models import User
from community.constants import (
    PAGINATOR_SIZE,
    
    EMAIL_NOTIFICATIONS_THRESHOLD,
    NOTIFICATION_USER_IDS_CACHE_KEY,
    NOTIFICATION_CACHE_KEY,
    LONG_CACHE_TIMEOUT,
    NOTIFICATION_GROUP_KV,
    
)
from django.db.models import OuterRef, Subquery, Case, When, Value, F
from .response_serializers import NotificationResponseSerializer
from community.models import  ArticleLike, CommentLike, Notification, Article, Comment
from django.contrib.contenttypes.models import ContentType
from django.db.models.functions import Coalesce
from django_redis import get_redis_connection
from community.tasks import send_email
from .database_utils import to_unix_ms
from django.core.cache import cache
from django.db import transaction
from django.db import models
from decouple import config


demo = config("DEMO", default="False").lower() == "true"
if demo:
    from community.dummyRedis import DummyRedis
    redis_conn = DummyRedis()
else:
    from django_redis import get_redis_connection
    redis_conn = get_redis_connection("default")

def get_paginated_notifications(request):

    user_instance = request.user
    requested_page = int(request.query_params.get("page", 1))
    dt = request.query_params.get("dt", to_unix_ms(None))

    cache_key = NOTIFICATION_USER_IDS_CACHE_KEY(user_instance.id)

    # Check if the zset exists in Redis
    if not redis_conn.exists(cache_key):
        notifications = Notification.objects.filter(user_id=user_instance.id).values_list(
            "id", "created_at"
        )
        mapping = {}
        for nid, created_at in notifications:
            score = to_unix_ms(created_at)  
            mapping[str(nid)] = score

        if mapping:
            redis_conn.zadd(cache_key, mapping)
            redis_conn.expire(cache_key, LONG_CACHE_TIMEOUT)
        
    # Fetch new notification IDs from the cache
    raw_with_scores  = redis_conn.zrevrangebyscore(
        cache_key,
        max=dt,
        min=0,
        start= (requested_page - 1) * PAGINATOR_SIZE,
        num= PAGINATOR_SIZE,
        withscores=True 
    )

    mapping = {member.decode(): int(score) for member, score in raw_with_scores }
    id_list = list(mapping.keys())

    # If no enough notifications found, do not provide next page
    moreNotifications = False
    if len(id_list) == PAGINATOR_SIZE + 1:
        id_list.pop()
        moreNotifications = True

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
            type_name=Case(
                When(group=0, then=Value("Comment")),
                When(group=1, then=Value("Like")),
                default=Value("Unknown"),
                output_field=models.CharField(),
            ),
            article_id=Case(
                When(
                    content_type__model="article",
                    then=F("object_id")
                ),
                When(
                    content_type__model="comment",
                    then=Subquery(
                        Comment.objects.filter(
                            id=OuterRef("object_id")
                        ).values("article__id")[:1]
                    )
                ),
                default=Value(None),
                output_field=models.IntegerField(),
            ),
        )
        serialized_notifications = NotificationResponseSerializer(
            queryset, many=True
        ).data
        serialized_notifications = {NOTIFICATION_CACHE_KEY(str(n["id"])): n for n in serialized_notifications}       
        cache.set_many(serialized_notifications)
        for item in results.items():
            if item[1] == None:
                results[item[0]] = serialized_notifications[NOTIFICATION_CACHE_KEY(item[0])]

    if moreNotifications:
        url = request.build_absolute_uri()
        next_page = f"{url.split('?')[0]}?page={requested_page + 1}&dt={dt}"
    else:
        next_page = None
        
    return {
        "next": next_page,
        "last_check_at": user_instance.last_notification_check,
        "results": {"notifications": results.values()},
    }

def add_notification(notification_type, target_instance):
    notify_users = []
    target_class = target_instance.__class__

    if target_class is ArticleLike:
        if target_instance.user.id == target_instance.article.user.id:
            # If the user is liking their own article, do not notify
            return
        notify_users = [target_instance.article.user.id]
        content_type = ContentType.objects.get_for_model(Article)
        object_id = target_instance.article.id

    elif target_class is CommentLike:
        if target_instance.user.id == target_instance.comment.user.id:
            # If the user is liking their own article, do not notify
            return
        notify_users = [target_instance.comment.user.id]
        content_type = ContentType.objects.get_for_model(Comment)
        object_id = target_instance.comment.id

    elif target_class is Comment:
        content_type = ContentType.objects.get_for_model(Comment)
        object_id = target_instance.id
        if target_instance.parent_comment is None:
            notify_users = Comment.objects.filter(
                    article=target_instance.article,
                    parent_comment=None
                ).exclude(
                    user=target_instance.user
                ).values_list(
                    'user', flat=True
                )
        else:
            notify_users = Comment.objects.filter(
                    parent_comment=target_instance.parent_comment
                ).exclude(
                    user=target_instance.user
                ).values_list(
                    'user', flat=True
                )
        notify_users = list(notify_users)
        notify_users.append(target_instance.article.user.id)
        notify_users = list(set(notify_users))
    
    for user_id in notify_users:
        user_instance = User.objects.get(pk=user_id)
        with transaction.atomic():
            notification_instance = Notification.objects.create(
                group=notification_type,
                user=user_instance, 
                content_type=content_type,
                object_id=object_id,
                email=False
            )
        
        cache_key = NOTIFICATION_USER_IDS_CACHE_KEY(user_instance.id)

        # Check if the zset exists in Redis
        if redis_conn.exists(cache_key):
            # Add the new notification to the sorted set
            redis_conn.zadd(
                cache_key,
                {str(notification_instance.id): to_unix_ms(notification_instance.created_at)}
            )
            redis_conn.expire(cache_key, LONG_CACHE_TIMEOUT)


        notification_queryset = Notification.objects.filter(
            user = user_id,
            created_at__gte = target_instance.user.last_notification_check,
            email=False
        )
        
            # Fetch the latest notifications that have not been emailed
        if notification_queryset.count() % EMAIL_NOTIFICATIONS_THRESHOLD == 0:
            notification_queryset = notification_queryset.annotate(
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
                type_name=Case(
                    When(group=0, then=Value("Comment")),
                    When(group=1, then=Value("Like")),
                    default=Value("Unknown"),
                    output_field=models.CharField(),
                ),
                article_id=Case(
                    When(
                        content_type__model="article",
                        then=F("object_id")
                    ),
                    When(
                        content_type__model="comment",
                        then=Subquery(
                            Comment.objects.filter(
                                id=OuterRef("object_id")
                            ).values("article__id")[:1]
                        )
                    ),
                    default=Value(None),
                    output_field=models.IntegerField(),
                ),
            ).order_by("-created_at")

            user_instance = User.objects.get(id=user_id)
                    
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

