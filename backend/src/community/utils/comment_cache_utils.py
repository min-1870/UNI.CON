from community.constants import (
    CACHE_TIMEOUT,
    PAGINATOR_SIZE,
    COMMENTS_CACHE_KEY,
    COMMENTS_LIKE_CACHE_KEY,
)
from .database_utils import get_set_temp_name_static_points
from community.models import ArticleUser, Comment, CommentLike
from .response_serializers import CommentResponseSerializer
from django.db.models import OuterRef, Subquery, Q
from django.core.cache import cache
from account.models import User
from django.urls import resolve


def cache_paginated_comments(
    request, article_instance, parent_comment_instance=None
):
    try:
        requested_page = int(request.query_params.get("page", 1))
    except Exception:
        requested_page = 0
    user_instance = request.user

    # Cache comments
    cache_key = COMMENTS_CACHE_KEY(
        article_instance.id, parent_comment_instance.id if parent_comment_instance else ""
    )
    comments_cache = cache.get(cache_key)

    # Initiate the cache if the cache is missing
    if comments_cache is None:
        total_comments = (
            Comment.objects.filter(article=article_instance)
            .filter(
                Q(parent_comment=parent_comment_instance)
                if parent_comment_instance
                else Q(parent_comment__isnull=True)
            )
            .count()
        )
        comments_cache = {"total_comments": total_comments, "comments": {}}
        cache.set(cache_key, comments_cache, CACHE_TIMEOUT)

    if comments_cache["total_comments"] == 0:
        return {
            "count": comments_cache["total_comments"],
            "next": None,
            "results": {"comments": []},
        }

    # Fetch comments if the cache does not have enough comments
    if len(comments_cache["comments"]) < requested_page * PAGINATOR_SIZE:
        start_index = len(comments_cache["comments"])
        end_index = min(comments_cache["total_comments"], requested_page * PAGINATOR_SIZE)
        comment_queryset = (
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
            .order_by("-created_at")[start_index:end_index]
        )

        # Serialize and set the cache
        new_serialized_comments = CommentResponseSerializer(
            comment_queryset, many=True
        ).data
        new_serialized_comments = {
            comment["id"]: comment for comment in new_serialized_comments
        }
        comments_cache["comments"].update(new_serialized_comments)
        cache.set(cache_key, comments_cache, CACHE_TIMEOUT)

    # Slice the comments that user requested only
    start_index = (requested_page - 1) * 10
    end_index = start_index + PAGINATOR_SIZE
    # print(start_index,end_index)
    serialized_comments = list(comments_cache["comments"].values())[start_index:end_index]

    # Cache user like status in bulk
    cache_key = COMMENTS_LIKE_CACHE_KEY(user_instance.id)
    user_liked_comments = cache.get(cache_key, None)
    if user_liked_comments is None:
        user_liked_comments = CommentLike.objects.filter(user=user_instance).values_list(
            "comment", flat=True
        )
        user_liked_comments = {pk: True for pk in user_liked_comments}
        cache.set(cache_key, user_liked_comments, CACHE_TIMEOUT)

    # Attach user specific data
    for comment in serialized_comments:
        comment["like_status"] = user_liked_comments.get(comment["id"], False)

    # Construct the response data with necessary pagination attributes
    url = request.build_absolute_uri()
    if end_index < comments_cache["total_comments"]:
        next_page = f"{url.split('?')[0]}?page={requested_page + 1}"
    else:
        next_page = None

    return {
        "count": comments_cache["total_comments"],
        "next": next_page,
        "results": {"comments": serialized_comments},
    }


def cache_serialized_comment(request, comment_instance, updated_fields={}):

    # Apply update to the attributes
    for field, value in updated_fields.items():
        setattr(comment_instance, field, value)

    comment_instance.save(update_fields=updated_fields.keys())
    comment_instance.refresh_from_db()

    # Cache the comment
    cache_key = COMMENTS_CACHE_KEY(
        comment_instance.article.id,
        comment_instance.parent_comment.id if comment_instance.parent_comment else "",
    )
    comments_cache = cache.get(cache_key, None)

    if comments_cache:

        # Update and set the cache
        serialized_comment = comments_cache["comments"][comment_instance.id]
        for field in updated_fields.keys():

            serialized_comment[field] = getattr(comment_instance, field)
        cache.set(cache_key, comments_cache)

    else:

        # Attach additional attributes
        comment_instance.user_school = comment_instance.user.school.initial
        articleUser_instance = ArticleUser.objects.get(
            article=comment_instance.article, user=comment_instance.user
        )
        comment_instance.user_temp_name = articleUser_instance.user_temp_name
        comment_instance.user_static_points = articleUser_instance.user_static_points
        serialized_comment = CommentResponseSerializer(comment_instance).data

    # Attach user specific data
    user_instance = request.user
    cache_key = COMMENTS_LIKE_CACHE_KEY(user_instance.id)
    user_liked_comments = cache.get(cache_key, None)
    view_name = resolve(request.path).view_name

    # Skip the fetching if the function called from like or unlike
    if view_name in ["comment-like", "comment-unlike"]:
        like_status = view_name == "comment-like"
        if user_liked_comments:
            user_liked_comments[comment_instance.id] = like_status
            cache.set(cache_key, user_liked_comments)

    else:
        if user_liked_comments:
            like_status = user_liked_comments.get(comment_instance.id, False)

        else:
            like_status = CommentLike.objects.filter(
                comment=comment_instance, user=user_instance
            ).exists()
    serialized_comment["like_status"] = like_status

    return serialized_comment


def add_cache_serialized_comment(comment_instance, user_instance):
    # Attach additional attributes
    user_temp_name, user_static_points = get_set_temp_name_static_points(
        comment_instance.article, user_instance
    )
    comment_instance.user_temp_name = user_temp_name
    comment_instance.user_static_points = user_static_points
    comment_instance.user_school = user_instance.school.initial
    serialized_comment = CommentResponseSerializer(comment_instance).data

    # Update the cache
    cache_key = COMMENTS_CACHE_KEY(
        comment_instance.article.id,
        comment_instance.parent_comment.id if comment_instance.parent_comment else "",
    )
    comments_cache = cache.get(cache_key)
    if comments_cache:
        comments_cache["total_comments"] += 1

        # Insert the comment at the beginning of cache
        comments = {serialized_comment["id"]: serialized_comment}
        comments.update(comments_cache["comments"])
        comments_cache["comments"] = comments
        cache.set(cache_key, comments_cache, CACHE_TIMEOUT)

    serialized_comment["like_status"] = False

    return serialized_comment
