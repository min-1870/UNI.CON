from community.constants import (
    CACHE_TIMEOUT,
    PAGINATOR_SIZE,
    NOTIFICATIONS_CACHE_KEY
)

from community.models import  Notification
from .response_serializers import NotificationResponseSerializer
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from account.utils import send_email



def paginated_notifications(request):
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
            Notification.objects.filter(user=user_instance)
            .order_by("-created_at")[start_index:end_index]
        )
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

    notification = Notification.objects.create(
        group=notification_type,
        user=user_instance, 
        content_type=ContentType.objects.get_for_model(model_class),
        object_id=object_id,
        read=False
    )
    
    serialized_notification = NotificationResponseSerializer(
            notification
    ).data

    send_email(
        subject="You have a new notification",
        body="You have a new notification",
        email=user_instance.email
    )

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