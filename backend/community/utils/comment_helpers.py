from community.constants import (
    CACHE_TIMEOUT,
    PAGINATOR_SIZE,
    LONG_CACHE_TIMEOUT,
    COMMENT_SCHOOL_IDS_CACHE_KEY,
    COMMENT_USER_LIKED_UNSORTED_IDS_CACHE_KEY,
    COMMENT_CACHE_KEY
)
from community.models import ArticleUser, Comment, CommentLike
from .response_serializers import CommentResponseSerializer
from django.db.models import OuterRef, Subquery, Q
from .database_utils import to_unix_ms
from django.core.cache import cache
from django.db import transaction
from account.models import User
from decouple import config


demo = config("DEMO", default="False").lower() == "true"
if demo:
    from community.dummyRedis import DummyRedis
    redis_conn = DummyRedis()
else:
    from django_redis import get_redis_connection
    redis_conn = get_redis_connection("default")

def get_paginated_comments(
    request, article_instance, parent_comment_instance=None
):
    user_instance = request.user
    requested_page = int(request.query_params.get("page", 1))
    dt = request.query_params.get("dt", to_unix_ms(None))

    cache_key = COMMENT_SCHOOL_IDS_CACHE_KEY(
        article_instance.id, '' if parent_comment_instance is None
        else parent_comment_instance.id
    )

    # Check if the zset exists in Redis
    if not redis_conn.exists(cache_key):
        comments = Comment.objects.filter(
            article=article_instance
        ).filter(
            Q(parent_comment=parent_comment_instance)
            if parent_comment_instance
            else Q(parent_comment__isnull=True)
        ).values_list(
            "id", "created_at"
        )
            
        mapping = {}
        for nid, value in comments:
            mapping[str(nid)] = to_unix_ms(value)

        if mapping:
            redis_conn.zadd(cache_key, mapping)
            redis_conn.expire(cache_key, LONG_CACHE_TIMEOUT)

    # Fetch new notification IDs from the cache
    raw_with_scores  = redis_conn.zrevrangebyscore(
        cache_key,
        max=dt,
        min=0,
        start= (requested_page - 1) * PAGINATOR_SIZE,
        num= PAGINATOR_SIZE+1,
        withscores=True 
    )
    mapping = {member.decode(): int(score) for member, score in raw_with_scores }
    id_list = list(mapping.keys())

    # If no enough comments found, do not provide next page
    moreComments = False
    if len(id_list) == PAGINATOR_SIZE + 1:
        id_list.pop()
        moreComments = True

    # Bulk get article from cache
    cache_keys = [COMMENT_CACHE_KEY(nid) for nid in id_list]
    cached = cache.get_many(cache_keys)

    # Build the results dictionary
    results = {}
    missing_ids = []
    for nid in id_list:
        key = COMMENT_CACHE_KEY(nid)
        serialized_article = cached.get(key)
        if serialized_article is None:
            missing_ids.append(nid)
            results[nid] = None
        else:
            results[nid] = serialized_article

    missing_annotated_comment_queryset = {}
    if len(missing_ids) > 0:
        # Query all of the missing article ids
        missing_annotated_comment_queryset = (
            Comment.objects.filter(article=article_instance)
            .filter(
                Q(parent_comment=parent_comment_instance)
                if parent_comment_instance
                else Q(parent_comment__isnull=True)
            )
            .annotate(
                user_temp_name=Subquery(
                    ArticleUser.objects.filter(
                        article=OuterRef("article"), user=OuterRef("user")
                    ).values("user_temp_name")[:1]
                ),
                user_static_points=Subquery(
                    ArticleUser.objects.filter(
                        article=OuterRef("article"), user=OuterRef("user")
                    ).values("user_static_points")[:1]
                ),
                user_school=Subquery(
                    User.objects.filter(id=OuterRef("user")).values("school__initial")[:1]
                ),
            )
        )

    # Serialized the missing comments
    missing_serialized_annotated_comments = CommentResponseSerializer(
        missing_annotated_comment_queryset, many=True
    ).data

    # Set annotated comment cache in bulk
    missing_serialized_annotated_comments = {
        COMMENT_CACHE_KEY(comment["id"]): comment
        for comment in missing_serialized_annotated_comments
    }
    cache.set_many(missing_serialized_annotated_comments, timeout=CACHE_TIMEOUT)

    # Cache user like status in bulk
    cache_key = COMMENT_USER_LIKED_UNSORTED_IDS_CACHE_KEY(user_instance.id)        
    user_liked_comments = cache.get(cache_key, None)
    if user_liked_comments is None:
        user_liked_comments = CommentLike.objects.filter(user=user_instance).values_list(
            "comment", flat=True
        )
        user_liked_comments = {pk: True for pk in user_liked_comments}
        cache.set(cache_key, user_liked_comments, CACHE_TIMEOUT)

    # Insert the missing comments and attach user specific data while maintain the order
    for nid in id_list:
        if results[nid] is None:
            results[nid] = missing_serialized_annotated_comments.get(COMMENT_CACHE_KEY(nid), None)

        if results[nid] is not None:
            # Attach user specific data
            results[nid]["like_status"] = user_liked_comments.get(
                results[nid]["id"], False
            )
        else:
            del results[nid]
            print(f"Comment {nid} not found in the database or cache.")
    
    if moreComments:
        url = request.build_absolute_uri()
        next_page = f"{url.split('?')[0]}?page={requested_page + 1}&dt={dt}"
    else:
        next_page = None
        
    return {
        "next": next_page,
        "results": {"comments": results.values()},
    }

def get_serialized_comment(request, comment_instance):

    # Cache the annotated comment
    cache_key = COMMENT_CACHE_KEY(comment_instance.id)
    serialized_annotated_comment = cache.get(cache_key, None)
    user_instance = request.user

    # If the cache missed
    if serialized_annotated_comment is None:

        # Annotate article instance
        articleUser_instance = ArticleUser.objects.get(
            article=comment_instance.article, user=comment_instance.user
        )
        comment_instance.user_temp_name = articleUser_instance.user_temp_name
        comment_instance.user_static_points = articleUser_instance.user_static_points
        comment_instance.user_school = comment_instance.user.school.initial

        # Make an annotated_comment to set the cache
        serialized_annotated_comment = CommentResponseSerializer(comment_instance).data
        cache.set(cache_key, serialized_annotated_comment, timeout=CACHE_TIMEOUT)

    # Cache user like status in bulk
    cache_key = COMMENT_USER_LIKED_UNSORTED_IDS_CACHE_KEY(user_instance.id)        
    user_liked_comments = cache.get(cache_key, None)
    if user_liked_comments is None:
        user_liked_comments = CommentLike.objects.filter(user=user_instance).values_list(
            "comment", flat=True
        )
        user_liked_comments = {pk: True for pk in user_liked_comments}
        cache.set(cache_key, user_liked_comments, CACHE_TIMEOUT)

    like_status = user_liked_comments.get(comment_instance.id, False)
    serialized_annotated_comment["like_status"] = like_status

    return serialized_annotated_comment

def update_comment(comment_instance, updated_fields={}):
    
    # Start an atomic transaction for database updates
    with transaction.atomic():
        Comment.objects.filter(id=comment_instance.id).update(**updated_fields)
        comment_instance.refresh_from_db()

    # Cache the comment
    cache_key = COMMENT_CACHE_KEY(
        comment_instance.id,
    )
    serialized_annotated_comment = cache.get(cache_key, None)

    if serialized_annotated_comment:

        # Update and set the cache
        for field in updated_fields.keys():
            serialized_annotated_comment[field] = getattr(comment_instance, field)
        cache.set(cache_key, serialized_annotated_comment, CACHE_TIMEOUT)
