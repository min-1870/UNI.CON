from community.models import Article, Comment, ArticleUser
from django.db.models import F, Sum
from randomname import get_name
from django.db import transaction


def update_article_engagement_score(article_instance):
    Article.objects.filter(id=article_instance.id).update(
        engagement_score=(F("views_count") * 1) + (F("likes_count") * 2) + (F("comments_count") * 3)
    )

def get_current_user_points(user_id):

    # Filter articles by the user and sum the counts
    article_points = Article.objects.filter(user=user_id).aggregate(
        # Sum the total comments and the likes while ignore number by the author
        total_views=Sum("views_count"),
        total_comments=Sum(F("comments_count") * 3),
        total_likes=Sum(F("likes_count") * 2),
    )

    # Filter comment by the user and sum the counts
    comment_points = (
        Comment.objects.filter(user=user_id)
        .exclude(article__user=user_id)
        .aggregate(
            # Sum the total comments and the likes
            # while ignore comment under the author's article
            total_comments=Sum(F("comments_count") * 3),
            total_likes=Sum(F("likes_count") * 2),
        )
    )

    # Calculate the sum of all counts
    total_points = (
        (article_points["total_views"] or 0)
        + (article_points["total_comments"] or 0)
        + (article_points["total_likes"] or 0)
        + (comment_points["total_comments"] or 0)
        + (comment_points["total_likes"] or 0)
    )

    return total_points


def get_set_temp_name_static_points(article_instance, user_instance):
    if not ArticleUser.objects.filter(
        user=user_instance, article=article_instance
    ).exists():
        user_temp_name = get_name()
        user_static_points = get_current_user_points(user_instance.id)
        
        with transaction.atomic():
            ArticleUser.objects.create(
                user=user_instance,
                article=article_instance,
                user_temp_name=user_temp_name,
                user_static_points=user_static_points,
            )
    else:
        article_user_instance = ArticleUser.objects.get(
            user=user_instance, article=article_instance
        )
        user_temp_name = article_user_instance.user_temp_name
        user_static_points = article_user_instance.user_static_points

    return (user_temp_name, user_static_points)
