from .constants import (
    CACHE_TIMEOUT,
    PAGINATOR_SIZE,
    ARTICLE_CACHE_KEY,
    ARTICLES_CACHE_KEY,
    ARTICLES_LIKE_CACHE_KEY,
)
from django.db.models import OuterRef, Subquery, F, Func, Value
from .database_utils import update_article_engagement_score
from .models import ArticleUser, ArticleCourse, ArticleLike
from .serializer import ArticleResponseSerializer
from django.db.models.functions import Coalesce
from django.core.cache import cache
from account.models import User
from django.urls import resolve

def cache_paginated_articles(request, queryset, cache_key=None):

    if cache_key is None:
        view_name = resolve(request.path).view_name
        school = request.user.school.id
        cache_key = ARTICLES_CACHE_KEY(school, view_name)
    
    # Cache the all article ids for the school
    all_article_ids = cache.get(cache_key)
    if not all_article_ids:
        all_article_ids = list(queryset.values_list("id", flat=True))
        cache.set(cache_key, all_article_ids, CACHE_TIMEOUT)
    
    # Calculate the number of articles created
    articles_count = len(all_article_ids)
    try:
        user_specific_articles_count = int(request.query_params.get("count", articles_count))
    except:
        user_specific_articles_count = articles_count
    new_articles_count = articles_count - user_specific_articles_count

    # Slice for the portion of the key based on the page
    try:
        page_number = int(request.query_params.get("page", 1))
    except:
        page_number = 1
    start_index = (page_number - 1) * PAGINATOR_SIZE + new_articles_count
    end_index = min(articles_count, start_index + PAGINATOR_SIZE + new_articles_count)
    page_article_ids = all_article_ids[start_index:end_index]

    serialized_annotated_articles = cache_serialized_articles(request.user, page_article_ids, queryset)
    
    # Construct the response data with necessary pagination attributes
    url = request.build_absolute_uri()
    if end_index < articles_count:
        next_page = f"{url.split('?')[0]}?page={page_number + 1}&count={user_specific_articles_count}"
    else:
        next_page = None
    return {
        "count": user_specific_articles_count,
        "next": next_page,
        "results": {"articles": serialized_annotated_articles},
    }

def cache_serialized_articles(user_instance, article_ids, queryset):
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
                        F("course__code"), Value(","), function="GROUP_CONCAT"
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
    
    return serialized_annotated_articles

def cache_serialized_article(
    request, article_instance, updated_fields={}
):
    cache_key = ARTICLE_CACHE_KEY(article_instance.id)

    # Update attributes for updated fields
    if len(updated_fields) != 0:
        for field, value in updated_fields.items():
            setattr(article_instance, field, value)
        article_instance.save(update_fields=updated_fields.keys())
        article_instance.refresh_from_db()
        article_instance = update_article_engagement_score(article_instance)
        cache.delete(cache_key)

    # Cache the annotated article
    serialized_annotated_article = cache.get(cache_key)
    user_instance = request.user

    # If the cache missed
    if not serialized_annotated_article:

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

    # If the cache miss fetch them
    if user_liked_articles is None:
        user_liked_articles = ArticleLike.objects.filter(user=user_instance).values_list(
            "article", flat=True
        )
        user_liked_articles = {pk: True for pk in user_liked_articles}
        cache.set(cache_key, user_liked_articles, CACHE_TIMEOUT)

    like_status = user_liked_articles.get(article_instance.id, False)
    serialized_annotated_article["like_status"] = like_status

    return serialized_annotated_article
