from .models import Article, Comment, CommentLike, ArticleUser
from django.db.models import OuterRef, Subquery, Exists, F, Sum
from account.models import User


def update_article_engagement_score(article_instance):
    article_instance.engagement_score = (
        (F("views_count") * 1) + (F("likes_count") * 2) + (F("comments_count") * 3)
    )

    article_instance.save(update_fields=["engagement_score"])
    article_instance.refresh_from_db()

    return article_instance


def annotate_comments(queryset, user_instance):

    # Annotate the queryset with the like_status using Exists
    queryset = queryset.annotate(
        like_status=Exists(
            Subquery(
                CommentLike.objects.filter(user=user_instance, comment=OuterRef("pk"))
            )
        ),
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

    return queryset


def annotate_comment(comment_instance, user_instance):

    comment_instance.user_school = comment_instance.user.school.initial

    articleUser_instance = ArticleUser.objects.get(
        article=comment_instance.article, user=comment_instance.user
    )
    comment_instance.user_temp_name = articleUser_instance.user_temp_name
    comment_instance.user_static_points = articleUser_instance.user_static_points

    exist = CommentLike.objects.filter(
        comment=comment_instance, user=user_instance
    ).exists()
    comment_instance.like_status = exist

    return comment_instance


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
