from community.models import Article, Comment, ArticleUser
from django.db.models import F, Sum
from randomname import get_name
from django.db import transaction


def update_article_engagement_score(article_instance):
    Article.objects.filter(id=article_instance.id).update(
        engagement_score=(F("views_count") * 1) + (F("likes_count") * 2) + (F("comments_count") * 3)
    )

def update_user_points(user_instance, delta_points, increment=True): 
    # Update the user's points
    if increment:
        user_instance.points += delta_points
        user_instance.save(update_fields=["points"])
    else:
        user_instance.points -= delta_points
        user_instance.save(update_fields=["points"])

def get_set_temp_name_static_points(article_instance, user_instance):
    if not ArticleUser.objects.filter(
        user=user_instance, article=article_instance
    ).exists():
        user_temp_name = get_name()
        user_static_points = user_instance.points
        
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
