# community/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import Signal
from django.dispatch import receiver
from community.models import Comment, CommentLike, Article, ArticleView, ArticleLike, ArticleSave
from community.utils import (
    update_user_liked_comments_cache,
    update_user_commented_article_cache,
    update_user_viewed_article_cache,
    update_user_saved_article_cache,
    update_user_posted_article_cache,
    update_recent_article_cache,
    add_notification,
    update_user_points

)
from community.constants import USER_POINT_DELTA
article_viewed = Signal()

@receiver(post_save, sender=Comment)
def on_comment_save(sender, instance, created, **kwargs):
    if created:
        update_user_commented_article_cache(instance.article)
        
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
        update_user_liked_comments_cache(instance.comment, instance.user, True)
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
    update_user_liked_comments_cache(instance.comment, instance.user, False)
    if instance.comment.user != instance.user:
        # Update user points
        update_user_points(
            instance.comment.user,
            USER_POINT_DELTA['comment']['like'],
            increment=False
        )

@receiver(post_delete, sender=CommentLike)
def on_commentLike_delete(sender, instance, created, **kwargs):
    pass

@receiver(post_save, sender=Article)
def on_article_save(sender, instance, created, **kwargs):
    if created:
        update_user_posted_article_cache(instance)
        update_recent_article_cache(instance)

@receiver(post_save, sender=ArticleView)
def on_articleView_save(sender, instance, created, **kwargs):
    if created:
        print("Article viewed signal triggered")
        update_user_viewed_article_cache(instance)
        if instance.article.user != instance.user:
            # Update user points
            update_user_points(
                instance.article.user,
                USER_POINT_DELTA['article']['view']
            )


@receiver(post_save, sender=ArticleSave)
def on_articleSave_save(sender, instance, created, **kwargs):
    if created:
        update_user_saved_article_cache(instance, True)
        

@receiver(post_delete, sender=ArticleSave)
def on_articleSave_delete(sender, instance, **kwargs):
    update_user_saved_article_cache(instance, False)

@receiver(post_save, sender=ArticleLike)
def on_articleLike_save(sender, instance, created, **kwargs):
    if created:
        update_user_saved_article_cache(instance, True)

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
    update_user_saved_article_cache(instance, False)

    if instance.article.user != instance.user:
        # Update user points
        update_user_points(
            instance.article.user,
            USER_POINT_DELTA['article']['like'],
            increment=False
        )
