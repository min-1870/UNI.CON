# community/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import Signal
from django.dispatch import receiver
from community.models import Comment, CommentLike, Article, ArticleView, ArticleLike, ArticleSave, ArticleTag
from community.tasks import get_n_register_embedding_vectors
from community.utils import (
    add_notification,
    update_user_points,
    update_article_engagement_score,

    update_sorted_article_ids_cache,
    update_unsorted_article_ids_cache,

    update_sorted_comment_ids_cache,
    update_unsorted_comment_ids_cache
)
from community.constants import (
    ARTICLE_SCHOOL_TAG_SEARCHED_IDS_CACHE_KEY,
    ARTICLE_SCHOOL_RECENT_IDS_CACHE_KEY,

    ARTICLE_USER_VIEWED_UNSORTED_IDS_CACHE_KEY,
    ARTICLE_USER_LIKED_UNSORTED_IDS_CACHE_KEY,
    ARTICLE_USER_SAVED_UNSORTED_IDS_CACHE_KEY,

    ARTICLE_USER_COMMENTED_IDS_CACHE_KEY,
    ARTICLE_USER_POSTED_IDS_CACHE_KEY,
    ARTICLE_USER_LIKED_IDS_CACHE_KEY,
    ARTICLE_USER_SAVED_IDS_CACHE_KEY,

    COMMENT_USER_LIKED_UNSORTED_IDS_CACHE_KEY,
    COMMENT_SCHOOL_IDS_CACHE_KEY,

    USER_POINT_DELTA,
)

article_viewed = Signal()

@receiver(post_save, sender=Comment)
def on_comment_save(sender, instance, created, **kwargs):
    if created:
        update_sorted_article_ids_cache(
            instance.article,
            ARTICLE_USER_COMMENTED_IDS_CACHE_KEY(instance.user.id),
            True
        )
        update_sorted_comment_ids_cache(
            instance,
            COMMENT_SCHOOL_IDS_CACHE_KEY(
                instance.article.id, instance.parent_comment.id 
                if instance.parent_comment else ''),
        )
        update_article_engagement_score(instance.article)
        if instance.parent_comment:
            if instance.parent_comment.user != instance.user:
                # Add notification for parent comment
                add_notification(
                    0,
                    instance.parent_comment.user,
                    Comment,
                    instance.article.id
                )
                # Update user points
                update_user_points(
                    instance.article.user,
                    USER_POINT_DELTA['comment']['comment']
                )
        else:
            if instance.article.user != instance.user:
                # Add notification for article
                add_notification(
                    0,
                    instance.article.user,
                    Article,
                    instance.article.id
                )
                # Update user points
                update_user_points(
                    instance.article.user,
                    USER_POINT_DELTA['article']['comment']
                )

@receiver(post_save, sender=CommentLike)
def on_commentLike_save(sender, instance, created, **kwargs):
    if created:
        update_unsorted_comment_ids_cache(
            instance.comment,
            COMMENT_USER_LIKED_UNSORTED_IDS_CACHE_KEY(
                instance.user.id),
            True
        )
        if instance.comment.user != instance.user:
            # Add notification
            add_notification(
                1,
                instance.comment.user,
                Comment,
                instance.comment.article.id
            )
            # Update user points
            update_user_points(
                instance.comment.user,
                USER_POINT_DELTA['comment']['like']
            )

@receiver(post_delete, sender=CommentLike)
def on_commentLike_delete(sender, instance, **kwargs):
    update_unsorted_comment_ids_cache(
        instance.comment,
        COMMENT_USER_LIKED_UNSORTED_IDS_CACHE_KEY(
            instance.user.id),
        False
    )
    if instance.comment.user != instance.user:
        # Update user points
        update_user_points(
            instance.comment.user,
            USER_POINT_DELTA['comment']['like'],
            increment=False
        )

@receiver(post_save, sender=Article)
def on_article_save(sender, instance, created, **kwargs):
    if created:
        update_sorted_article_ids_cache(
            instance,
            ARTICLE_SCHOOL_RECENT_IDS_CACHE_KEY(instance.user.school.id),
            True
        )
        update_sorted_article_ids_cache(
            instance,
            ARTICLE_USER_POSTED_IDS_CACHE_KEY(instance.user.id),
            True
        )
        update_article_engagement_score(instance)
        get_n_register_embedding_vectors.delay(instance.id)

@receiver(post_save, sender=ArticleTag)
def on_articleTag_save(sender, instance, created, **kwargs):
    if created:
        # Update sorted article ids cache for the tag
        update_sorted_article_ids_cache(
            instance.article,
            ARTICLE_SCHOOL_TAG_SEARCHED_IDS_CACHE_KEY(
                instance.article.user.school.id, instance.tag.name),
            True
        )

@receiver(post_delete, sender=ArticleTag)
def on_articleTag_delete(sender, instance, **kwargs):
    # Update sorted article ids cache for the tag
    update_sorted_article_ids_cache(
        instance.article,
        ARTICLE_SCHOOL_TAG_SEARCHED_IDS_CACHE_KEY(
            instance.article.user.school.id, instance.tag.name),
        False
    )

@receiver(post_save, sender=ArticleView)
def on_articleView_save(sender, instance, created, **kwargs):
    if created:
        update_unsorted_article_ids_cache(
            instance.article,
            ARTICLE_USER_VIEWED_UNSORTED_IDS_CACHE_KEY(instance.user.id),
            True
        )
        update_article_engagement_score(instance.article)
        if instance.article.user != instance.user:
            # Update user points
            update_user_points(
                instance.article.user,
                USER_POINT_DELTA['article']['view']
            )

@receiver(post_save, sender=ArticleSave)
def on_articleSave_save(sender, instance, created, **kwargs):
    if created:
        update_sorted_article_ids_cache(
            instance.article,
            ARTICLE_USER_SAVED_IDS_CACHE_KEY(instance.user.id),
            True
        )
        update_unsorted_article_ids_cache(
            instance.article,
            ARTICLE_USER_SAVED_UNSORTED_IDS_CACHE_KEY(instance.user.id),
            True
        )
    
@receiver(post_delete, sender=ArticleSave)
def on_articleSave_delete(sender, instance, **kwargs):
        update_sorted_article_ids_cache(
            instance.article,
            ARTICLE_USER_SAVED_IDS_CACHE_KEY(instance.user.id),
            False
        )
        update_unsorted_article_ids_cache(
            instance.article,
            ARTICLE_USER_SAVED_UNSORTED_IDS_CACHE_KEY(instance.user.id),
            False
        )

@receiver(post_save, sender=ArticleLike)
def on_articleLike_save(sender, instance, created, **kwargs):
    if created:
        update_sorted_article_ids_cache(
            instance.article,
            ARTICLE_USER_LIKED_IDS_CACHE_KEY(instance.user.id),
            True
        )
        update_unsorted_article_ids_cache(
            instance.article,
            ARTICLE_USER_LIKED_UNSORTED_IDS_CACHE_KEY(instance.user.id),
            True
        )
        update_article_engagement_score(instance.article)
        if instance.article.user != instance.user:
            # Add notification
            add_notification(
                1,
                instance.user,
                Article,
                instance.id
            )

            # Update user points
            update_user_points(
                instance.article.user,
                USER_POINT_DELTA['article']['like']
            )

@receiver(post_delete, sender=ArticleLike)
def on_articleLike_delete(sender, instance, **kwargs):
    update_sorted_article_ids_cache(
        instance.article,
        ARTICLE_USER_LIKED_IDS_CACHE_KEY(instance.user.id),
        False
    )
    update_unsorted_article_ids_cache(
        instance.article,
        ARTICLE_USER_LIKED_UNSORTED_IDS_CACHE_KEY(instance.user.id),
        False
    )
    update_article_engagement_score(instance.article)
    if instance.article.user != instance.user:
        # Update user points
        update_user_points(
            instance.article.user,
            USER_POINT_DELTA['article']['like'],
            increment=False
        )
