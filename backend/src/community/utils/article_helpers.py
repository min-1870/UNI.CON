from community.constants import (
    CACHE_TIMEOUT,
    PAGINATOR_SIZE,
    ARTICLE_CACHE_KEY,
    ARTICLES_CACHE_KEY,
    ARTICLES_LIKE_CACHE_KEY,
    ARTICLES_VIEW_CACHE_KEY,
    ARTICLES_SAVE_CACHE_KEY
)
from community.models import Article, ArticleUser, ArticleCourse, ArticleLike, ArticleView, ArticleSave, Comment
from django.db.models import OuterRef, Subquery, F, Func, Value
from .response_serializers import ArticleResponseSerializer
from .database_utils import update_article_engagement_score
from django.db.models.functions import Coalesce
from django.core.cache import cache
from account.models import User
from django.urls import resolve
from django.db import transaction


def get_paginated_articles(request, queryset, cache_key=None):
    if cache_key is None:
        view_name = resolve(request.path).view_name
        school = request.user.school.id
        cache_key = ARTICLES_CACHE_KEY(school, view_name)

    # Cache the all article ids for the school
    all_article_ids = cache.get(cache_key, None)
    if all_article_ids is None:
        all_article_ids = list(queryset.values_list("id", flat=True))
        cache.set(cache_key, all_article_ids, CACHE_TIMEOUT)

    # Calculate the number of articles created
    articles_count = len(all_article_ids)
    try:
        user_specific_articles_count = int(
            request.query_params.get("count", articles_count)
        )
    except Exception:
        user_specific_articles_count = articles_count
    new_articles_count = articles_count - user_specific_articles_count

    # Slice for the portion of the key based on the page
    try:
        page_number = int(request.query_params.get("page", 1))
    except Exception:
        page_number = 1
    start_index = (page_number - 1) * PAGINATOR_SIZE + new_articles_count
    end_index = min(articles_count, start_index + PAGINATOR_SIZE + new_articles_count)
    page_article_ids = all_article_ids[start_index:end_index]

    serialized_annotated_articles = get_serialized_articles(
        request.user, page_article_ids, queryset
    )

    # Construct the response data with necessary pagination attributes
    url = request.build_absolute_uri()
    if end_index < articles_count:
        next_page = (
            f"{url.split('?')[0]}?"
            f"page={page_number + 1}&"
            f"count={user_specific_articles_count}"
        )
    else:
        next_page = None
    return {
        "count": user_specific_articles_count,
        "next": next_page,
        "results": {"articles": serialized_annotated_articles},
    }


def get_serialized_articles(user_instance, article_ids, queryset):
    # Bulk cache the articles in the page
    missing_ids = []
    serialized_annotated_articles = []
    serialized_annotated_articles_cache = cache.get_many(
        [ARTICLE_CACHE_KEY(pk) for pk in article_ids]
    )
    for pk in article_ids:
        cache_key = ARTICLE_CACHE_KEY(pk)
        serialized_annotated_article = serialized_annotated_articles_cache.get(
            cache_key, None
        )

        # Collect the missing article ids
        if serialized_annotated_article is None:
            missing_ids.append(pk)
            serialized_annotated_articles.append(pk)
        else:
            serialized_annotated_articles.append(serialized_annotated_article)

    # Query all of the missing article ids
    missing_annotated_article_queryset = queryset.filter(pk__in=missing_ids).annotate(
        user_school=Subquery(
            User.objects.filter(id=OuterRef("user")).values("school__initial")[:1]
        ),
        user_temp_name=Subquery(
            ArticleUser.objects.filter(
                article=OuterRef("pk"), user=OuterRef("user")
            ).values("user_temp_name")[:1]
        ),
        user_static_points=Subquery(
            ArticleUser.objects.filter(
                article=OuterRef("pk"), user=OuterRef("user")
            ).values("user_static_points")[:1]
        ),
        course_code=Coalesce(
            Subquery(
                ArticleCourse.objects.filter(article=OuterRef("pk"))
                .values("course__code")
                .annotate(
                    course_codes=Func(
                        F("course__code"), Value(","), function="STRING_AGG"
                    )
                )
                .values("course_codes")[:1],
            ),
            Value(""),
        ),
    )

    # Serialized the missing articles
    missing_serialized_annotated_articles = ArticleResponseSerializer(
        missing_annotated_article_queryset, many=True
    ).data

    # Set annotated article cache in bulk
    missing_serialized_annotated_articles = {
        ARTICLE_CACHE_KEY(article["id"]): article
        for article in missing_serialized_annotated_articles
    }
    cache.set_many(missing_serialized_annotated_articles, timeout=CACHE_TIMEOUT)

    # Cache user like status in bulk
    cache_key = ARTICLES_LIKE_CACHE_KEY(user_instance.id)
    user_liked_articles = cache.get(cache_key, None)
    if user_liked_articles is None:
        user_liked_articles = ArticleLike.objects.filter(user=user_instance).values_list(
            "article", flat=True
        )
        user_liked_articles = {pk: True for pk in user_liked_articles}
        cache.set(cache_key, user_liked_articles, CACHE_TIMEOUT)

    # Cache user view status in bulk
    cache_key = ARTICLES_VIEW_CACHE_KEY(user_instance.id)
    user_viewed_articles = cache.get(cache_key, None)
    if user_viewed_articles is None:
        user_viewed_articles = ArticleLike.objects.filter(user=user_instance).values_list(
            "article", flat=True
        )
        user_viewed_articles = {pk: True for pk in user_viewed_articles}
        cache.set(cache_key, user_viewed_articles, CACHE_TIMEOUT)

    # Cache user save status in bulk
    cache_key = ARTICLES_SAVE_CACHE_KEY(user_instance.id)
    user_saved_articles = cache.get(cache_key, None)
    if user_saved_articles is None:
        user_saved_articles = ArticleSave.objects.filter(user=user_instance).values_list(
            "article", flat=True
        )
        user_saved_articles = {pk: True for pk in user_saved_articles}
        cache.set(cache_key, user_saved_articles, CACHE_TIMEOUT)

    # Insert the articles and attach user specific data while maintain the order
    for i, pk_or_article in enumerate(serialized_annotated_articles):

        # For missed articles only
        if isinstance(pk_or_article, int):

            # Insert the missed article to the result
            serialized_annotated_articles[i] = missing_serialized_annotated_articles.get(
                ARTICLE_CACHE_KEY(pk_or_article)
            )

        # Attach user specific data
        like_status = user_liked_articles.get(
            serialized_annotated_articles[i]["id"], False
        )
        serialized_annotated_articles[i]["like_status"] = like_status

        view_status = user_viewed_articles.get(
            serialized_annotated_articles[i]["id"], False
        )
        serialized_annotated_articles[i]["view_status"] = view_status

        save_status = user_saved_articles.get(
            serialized_annotated_articles[i]["id"], False
        )
        serialized_annotated_articles[i]["save_status"] = save_status

    return serialized_annotated_articles


def get_serialized_article(request, article_instance):

    # Cache the annotated article
    cache_key = ARTICLE_CACHE_KEY(article_instance.id)
    serialized_annotated_article = cache.get(cache_key, None)
    user_instance = request.user

    # If the cache missed
    if serialized_annotated_article is None:

        # Annotate article instance
        article_instance.user_school = article_instance.user.school.initial
        articleUser_instance = ArticleUser.objects.get(
            article=article_instance, user=article_instance.user
        )
        article_instance.user_temp_name = articleUser_instance.user_temp_name
        article_instance.user_static_points = articleUser_instance.user_static_points
        course_codes = ArticleCourse.objects.filter(article=article_instance).values_list(
            "course__code", flat=True
        )
        article_instance.course_code = ", ".join(course_codes) if course_codes else ""

        # Make an annotated_article to set the cache
        serialized_annotated_article = ArticleResponseSerializer(article_instance).data
        cache.set(cache_key, serialized_annotated_article, timeout=CACHE_TIMEOUT)

    # Attache the user specific attribute
    cache_key = ARTICLES_LIKE_CACHE_KEY(user_instance.id)
    user_liked_articles = cache.get(cache_key, None)
    
    cache_key = ARTICLES_SAVE_CACHE_KEY(user_instance.id)
    user_saved_articles = cache.get(cache_key, None)

    # If the cache miss fetch them
    if user_liked_articles is None:
        user_liked_articles = ArticleLike.objects.filter(user=user_instance).values_list(
            "article", flat=True
        )
        user_liked_articles = {pk: True for pk in user_liked_articles}
        cache.set(cache_key, user_liked_articles, CACHE_TIMEOUT)

    like_status = user_liked_articles.get(article_instance.id, False)
    serialized_annotated_article["like_status"] = like_status

    if user_saved_articles is None:
        user_saved_articles = ArticleSave.objects.filter(user=user_instance).values_list(
            "article", flat=True
        )
        user_saved_articles = {pk: True for pk in user_saved_articles}
        cache.set(cache_key, user_saved_articles, CACHE_TIMEOUT)

    save_status = user_saved_articles.get(article_instance.id, False)
    serialized_annotated_article["save_status"] = save_status

    return serialized_annotated_article

def update_article(article_instance, updated_fields=None):
    if updated_fields is None:
        updated_fields = {}

    # Start an atomic transaction for database updates
    with transaction.atomic():
        # Update attributes for updated fields in the permanent database
        Article.objects.filter(pk=article_instance.id).update(**updated_fields)
        update_article_engagement_score(article_instance)
        article_instance.refresh_from_db()
    
    # Update the cache
    cache_key = ARTICLE_CACHE_KEY(article_instance.id)
    serialized_annotated_article = cache.get(cache_key, None)

    if serialized_annotated_article:
        for field in updated_fields.keys():
            serialized_annotated_article[field] = getattr(article_instance, field)

        cache.set(cache_key, serialized_annotated_article, timeout=CACHE_TIMEOUT)

def update_user_liked_article_cache(request, article_instance, like_status):
    user_instance = request.user
    cache_key = ARTICLES_LIKE_CACHE_KEY(user_instance.id)
    user_liked_articles = cache.get(cache_key, None)
    if user_liked_articles is None:
        user_liked_articles = ArticleLike.objects.filter(
            user=user_instance
        ).values_list("article", flat=True)
        user_liked_articles = {pk: True for pk in user_liked_articles}
    else:
        user_liked_articles[article_instance.id] = like_status
    cache.set(cache_key, user_liked_articles, CACHE_TIMEOUT)
    
    cache_key = ARTICLES_CACHE_KEY(request.user.school.id, "article-liked-articles", request.user.id)
    cache.set(cache_key, list(user_liked_articles.keys()), CACHE_TIMEOUT)

def update_user_saved_article_cache(request, article_instance, save_status):

    user_instance = request.user
    cache_key = ARTICLES_SAVE_CACHE_KEY(user_instance.id)
    user_saved_articles = cache.get(cache_key, None)
    if user_saved_articles is None:
        user_saved_articles = ArticleSave.objects.filter(
            user=user_instance
        ).values_list("article", flat=True)
        user_saved_articles = {pk: True for pk in user_saved_articles}
    else:
        user_saved_articles[article_instance.id] = save_status
    cache.set(cache_key, user_saved_articles, CACHE_TIMEOUT)
    
    cache_key = ARTICLES_CACHE_KEY(request.user.school.id, "article-saved-articles", request.user.id)
    cache.set(cache_key, list(user_saved_articles.keys()), CACHE_TIMEOUT)

def update_user_viewed_article_cache(request, article_instance):
    user_instance = request.user
    cache_key = ARTICLES_VIEW_CACHE_KEY(user_instance.id)
    user_viewed_articles = cache.get(cache_key, None)
    if user_viewed_articles is None:
        user_viewed_articles = ArticleView.objects.filter(
            user=user_instance
        ).values_list("article", flat=True)
        user_viewed_articles = {pk: True for pk in user_viewed_articles}
    else:
        user_viewed_articles[article_instance.id] = True
    cache.set(cache_key, user_viewed_articles, CACHE_TIMEOUT)

def update_user_commented_article_cache(request, article_instance):

    user_instance = request.user
    cache_key = ARTICLES_CACHE_KEY(request.user.school.id, "article-commented-articles", request.user.id)
    user_commented_articles_ids = cache.get(cache_key, None)
    if user_commented_articles_ids is None:
        user_commented_articles_ids = list(Comment.objects.filter(
            user=user_instance
        ).values_list("article", flat=True))
    else:
        user_commented_articles_ids.append(article_instance.id)
    cache.set(cache_key, user_commented_articles_ids, CACHE_TIMEOUT)
