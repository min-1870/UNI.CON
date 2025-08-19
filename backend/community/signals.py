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

    update_sorted_ids_cache,
    bump_facet_version,
    update_article_action,
    update_comment_action
)
from community.constants import (
    NOTIFICATION_GROUP_KV,
    COMMENT_SCHOOL_IDS_CACHE_KEY,
    USER_POINT_DELTA,
)

article_viewed = Signal()

@receiver(post_save, sender=Comment)
def on_comment_save(sender, instance, created, **kwargs):
    if created:

        bump_facet_version({'feed':'commented'},  instance.user)
        update_sorted_ids_cache(
            instance,
            COMMENT_SCHOOL_IDS_CACHE_KEY(
                instance.article.id, instance.parent_comment.id 
                if instance.parent_comment else ''),
        )
        update_article_engagement_score(instance.article)
        
        add_notification(NOTIFICATION_GROUP_KV['comment'], instance)

        if instance.parent_comment:
            if instance.parent_comment.user != instance.user:
                # Update user points
                update_user_points(
                    instance.article.user,
                    USER_POINT_DELTA['comment']['comment']
                )
        else:
            if instance.article.user != instance.user:
                # Update user points
                update_user_points(
                    instance.article.user,
                    USER_POINT_DELTA['article']['comment']
                )

@receiver(post_save, sender=CommentLike)
def on_commentLike_save(sender, instance, created, **kwargs):
    if created:
        update_comment_action('liked', True, instance.user, instance.comment)
        add_notification(NOTIFICATION_GROUP_KV['like'], instance)

        if instance.comment.user != instance.user:
            # Update user points
            update_user_points(
                instance.comment.user,
                USER_POINT_DELTA['comment']['like']
            )

@receiver(post_delete, sender=CommentLike)
def on_commentLike_delete(sender, instance, **kwargs):
    update_comment_action('liked', False, instance.user, instance.comment)

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
        bump_facet_version({'feed':'posted'}, instance.user)
        if instance.marketplace:
            bump_facet_version({'marketplace':True}, instance.user)
        else:
            bump_facet_version({'unicon':True}, instance.user)
            bump_facet_version({'unicon':False}, instance.user)
            update_article_engagement_score(instance)
            get_n_register_embedding_vectors.delay(instance.id)

@receiver(post_save, sender=ArticleTag)
def on_articleTag_save(sender, instance, created, **kwargs):
    if created:
        bump_facet_version(
            {'feed':'tag', 'variable':instance.tag.name},
            instance.article.user
        )

@receiver(post_delete, sender=ArticleTag)
def on_articleTag_delete(sender, instance, **kwargs):
    bump_facet_version(
        {'feed':'tag', 'variable':instance.tag.name},
        instance.article.user
    )

@receiver(post_save, sender=ArticleView)
def on_articleView_save(sender, instance, created, **kwargs):
    if created:
        update_article_action('viewed', True, instance.user, instance.article)
        update_article_engagement_score(instance.article)
        if instance.article.user != instance.user and not instance.article.deleted and not instance.article.marketplace:
            # Update user points
            update_user_points(
                instance.article.user,
                USER_POINT_DELTA['article']['view']
            )

@receiver(post_save, sender=ArticleSave)
def on_articleSave_save(sender, instance, created, **kwargs):
    if created:
        update_article_action('saved', True, instance.user, instance.article)
        bump_facet_version({'feed':'saved'}, instance.user)
    
@receiver(post_delete, sender=ArticleSave)
def on_articleSave_delete(sender, instance, **kwargs):
        update_article_action('saved', False, instance.user, instance.article)
        bump_facet_version({'feed':'saved'}, instance.user)

@receiver(post_save, sender=ArticleLike)
def on_articleLike_save(sender, instance, created, **kwargs):
    if created:
        update_article_action('liked', True, instance.user, instance.article)
        bump_facet_version({'feed':'liked'}, instance.user)

        update_article_engagement_score(instance.article)

        add_notification(NOTIFICATION_GROUP_KV['like'], instance)

        if instance.article.user != instance.user:

            # Update user points
            update_user_points(
                instance.article.user,
                USER_POINT_DELTA['article']['like']
            )

@receiver(post_delete, sender=ArticleLike)
def on_articleLike_delete(sender, instance, **kwargs):
    update_article_action('liked', False, instance.user, instance.article)
    bump_facet_version({'feed':'liked'}, instance.user)
    update_article_engagement_score(instance.article)
    if instance.article.user != instance.user:
        # Update user points
        update_user_points(
            instance.article.user,
            USER_POINT_DELTA['article']['like'],
            increment=False
        )
