from community.constants import (
    ARTICLE_USER_LIKED_UNSORTED_IDS_CACHE_KEY,
    ARTICLE_USER_VIEWED_UNSORTED_IDS_CACHE_KEY,
    ARTICLE_USER_SAVED_UNSORTED_IDS_CACHE_KEY,
    ARTICLE_CACHE_KEY,
    
    LONG_CACHE_TIMEOUT,
    PAGINATOR_SIZE,
    CACHE_TIMEOUT,
)
from community.models import Article, ArticleUser, ArticleTag, ArticleLike, ArticleSave, Tag, ArticleView
from community.utils.database_utils import get_faiss_index, search_similar_embeddings
from .response_serializers import ArticleResponseSerializer
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import OuterRef, Subquery, Value
from django.db.models.functions import Coalesce
from django_redis import get_redis_connection
from django.db.models import Case, When
from .database_utils import to_unix_ms
from django.core.cache import cache
from django.db import transaction
from account.models import User

redis_conn = get_redis_connection("default")
    
def get_paginated_articles(request, queryset, sort_by, cache_key, embedding_vector=None, timeout=None):

    user_instance = request.user
    requested_page = int(request.query_params.get("page", 1))

    if sort_by == 'embedding_result':
        search_content = request.query_params.get("search_content", None)
        if not redis_conn.exists(cache_key):
            # Fetch Ids of the article based on the similarity
            ids = search_similar_embeddings(
                get_faiss_index(), embedding_vector, len(queryset)
            )

            # Fetch the article based on the fetched id while maintaining the order
            order = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(ids)])
            queryset = queryset.filter(pk__in=ids).order_by(order)
            score = len(queryset)
        else:
            # Fetch the article based on the cached ids
            ids = redis_conn.zrevrange(cache_key, 0, -1)
            queryset = queryset.filter(pk__in=ids)
            score = len(queryset)

    elif sort_by == 'engagement_score':
        score = request.query_params.get("score", int(queryset.order_by("-engagement_score").first().engagement_score))

    else:
        dt = request.query_params.get("dt", to_unix_ms(None))

    
    # Check if the zset exists in Redis
    if not redis_conn.exists(cache_key):
        if sort_by == 'created_at':
            articles = queryset.values_list(
                "id", "created_at"
            )
        elif sort_by == 'engagement_score':
            articles = queryset.values_list(
                "id", "engagement_score"
            )
        elif sort_by == 'embedding_result':
            articles = [(article.id, score - idx) for idx, article in enumerate(queryset)]
            
        mapping = {}
        for nid, value in articles:
            if sort_by == 'created_at':
                value = to_unix_ms(value)
            mapping[str(nid)] = value

        if mapping:
            redis_conn.zadd(cache_key, mapping)
            redis_conn.expire(cache_key, timeout if timeout else LONG_CACHE_TIMEOUT)

    # Fetch new article IDs from the cache
    raw_with_scores  = redis_conn.zrevrangebyscore(
        cache_key,
        max=dt if sort_by == 'created_at' else score,
        min=0,
        start= (requested_page - 1) * PAGINATOR_SIZE,
        num= PAGINATOR_SIZE,
        withscores=True 
    )
    mapping = {member.decode(): int(score) for member, score in raw_with_scores }
    id_list = list(mapping.keys())

    # Bulk get article from cache
    cache_keys = [ARTICLE_CACHE_KEY(nid) for nid in id_list]
    cached = cache.get_many(cache_keys)

    # Build the results dictionary
    results = {}
    missing_ids = []
    for nid in id_list:
        key = ARTICLE_CACHE_KEY(nid)
        serialized_article = cached.get(key)
        if serialized_article is None:
            missing_ids.append(nid)
            results[nid] = None
        else:
            results[nid] = serialized_article

    missing_annotated_article_queryset = {}
    if len(missing_ids) > 0:
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
            tag=Coalesce(
                Subquery(
                    ArticleTag.objects.filter(
                        article=OuterRef('pk')
                    ).values(
                        'article'
                    ).annotate(
                        tag_list=ArrayAgg('tag__name', distinct=True)
                    ).values('tag_list')[:1]
                ), Value([])
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
    cache_key = ARTICLE_USER_LIKED_UNSORTED_IDS_CACHE_KEY(user_instance.id)        
    user_liked_articles = cache.get(cache_key, None)
    if user_liked_articles is None:
        user_liked_articles = ArticleLike.objects.filter(user=user_instance).values_list(
            "article", flat=True
        )
        user_liked_articles = {pk: True for pk in user_liked_articles}
        cache.set(cache_key, user_liked_articles, CACHE_TIMEOUT)

    # Cache user view status in bulk
    cache_key = ARTICLE_USER_VIEWED_UNSORTED_IDS_CACHE_KEY(user_instance.id)
    user_viewed_articles = cache.get(cache_key, None)
    if user_viewed_articles is None:
        user_viewed_articles = ArticleView.objects.filter(user=user_instance).values_list(
            "article", flat=True
        )
        user_viewed_articles = {pk: True for pk in user_viewed_articles}
        cache.set(cache_key, user_viewed_articles, CACHE_TIMEOUT)

    # Cache user save status in bulk
    cache_key = ARTICLE_USER_SAVED_UNSORTED_IDS_CACHE_KEY(user_instance.id)
    user_saved_articles = cache.get(cache_key, None)
    if user_saved_articles is None:
        user_saved_articles = ArticleSave.objects.filter(user=user_instance).values_list(
            "article", flat=True
        )
        user_saved_articles = {pk: True for pk in user_saved_articles}
        cache.set(cache_key, user_saved_articles, CACHE_TIMEOUT)

    # Insert the missing articles and attach user specific data while maintain the order
    for nid in id_list:
        if results[nid] is None:
            results[nid] = missing_serialized_annotated_articles.get(ARTICLE_CACHE_KEY(nid), None)
        
        # Attach user specific data
        results[nid]["like_status"] = user_liked_articles.get(
            results[nid]["id"], False
        )
        # Attach user specific data
        results[nid]["view_status"] = user_viewed_articles.get(
            results[nid]["id"], False
        )
        # Attach user specific data
        results[nid]["save_status"] = user_saved_articles.get(
            results[nid]["id"], False
        )
    
    if len(results.items()) < PAGINATOR_SIZE:
        next_page = None
    else:
        url = request.build_absolute_uri()
        if sort_by == 'embedding_result':
            next_page = f"{url.split('?')[0]}?page={requested_page + 1}&score={score}"
            if search_content:
                next_page += f"&search_content={search_content}"
        elif sort_by == 'created_at':
            next_page = f"{url.split('?')[0]}?page={requested_page + 1}&dt={dt}"
        else:
            next_page = f"{url.split('?')[0]}?page={requested_page + 1}&score={score}"
    # print(results)
    return {
        "next": next_page,
        "results": {"articles": results.values()},
    }

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
        tag = ArticleTag.objects.filter(article=article_instance).values_list(
            "tag__name", flat=True
        )
        article_instance.tag = list(tag) if tag else []

        # Make an annotated_article to set the cache
        serialized_annotated_article = ArticleResponseSerializer(article_instance).data
        cache.set(cache_key, serialized_annotated_article, timeout=CACHE_TIMEOUT)

    # Attache the user specific attribute
    cache_key = ARTICLE_USER_LIKED_UNSORTED_IDS_CACHE_KEY(user_instance.id)
    user_liked_articles = cache.get(cache_key, None)
    
    cache_key = ARTICLE_USER_SAVED_UNSORTED_IDS_CACHE_KEY(user_instance.id)
    user_saved_articles = cache.get(cache_key, None)
    
    cache_key = ARTICLE_USER_VIEWED_UNSORTED_IDS_CACHE_KEY(user_instance.id)
    user_viewed_articles = cache.get(cache_key, None)

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

    if user_viewed_articles is None:
        user_viewed_articles = ArticleView.objects.filter(user=user_instance).values_list(
            "article", flat=True
        )
        user_viewed_articles = {pk: True for pk in user_viewed_articles}
        cache.set(cache_key, user_viewed_articles, CACHE_TIMEOUT)

    view_status = user_viewed_articles.get(article_instance.id, False)
    serialized_annotated_article["view_status"] = view_status

    return serialized_annotated_article

def update_article_tag(article_instance, new_tags=[]):
    old_tags = ArticleTag.objects.filter(article=article_instance).values_list(
        "tag__name", flat=True
    )
    old_tags = list(old_tags) if old_tags else []
    
    if set(old_tags) == set(new_tags):
        # If the tags are the same, do nothing
        return
    
    # If the tags are different, update the tags
    added_tags = set(new_tags) - set(old_tags)
    removed_tags = set(old_tags) - set(new_tags)

    # Start an atomic transaction for database updates
    with transaction.atomic():
        if added_tags:
            for tag_name in added_tags:
                tag_obj, _ = Tag.objects.get_or_create(name=tag_name.lower().strip())
                ArticleTag.objects.create(article=article_instance, tag=tag_obj)

        if removed_tags:
            for tag_name in removed_tags:
                tag_obj = Tag.objects.filter(name=tag_name.lower().strip()).first()
                if tag_obj:
                    # Only remove the ArticleTag relation for this article and tag
                    ArticleTag.objects.filter(article=article_instance, tag=tag_obj).delete()
                    # If the tag is not connected to any other articles, delete the tag itself
                    if not ArticleTag.objects.filter(tag=tag_obj).exists():
                        tag_obj.delete()

    # Update the cache for the article
    cache_key = ARTICLE_CACHE_KEY(article_instance.id)
    serialized_annotated_article = cache.get(cache_key, None)
    if serialized_annotated_article:
        # Update the tag in the cache
        serialized_annotated_article['tag'] = new_tags
        cache.set(cache_key, serialized_annotated_article, timeout=CACHE_TIMEOUT) 

def update_article(article_instance, updated_fields={}):

    # Start an atomic transaction for database updates
    with transaction.atomic():
        # Update attributes for updated fields in the permanent database
        Article.objects.filter(pk=article_instance.id).update(**updated_fields)
        article_instance.refresh_from_db()
    
    # Update the cache
    cache_key = ARTICLE_CACHE_KEY(article_instance.id)
    serialized_annotated_article = cache.get(cache_key, None)

    if serialized_annotated_article:
        # Avoid the unnecessary attribute to be existed in the cache
        updated_fields.pop('embedding_vector', None)

        for field in updated_fields.keys():
            serialized_annotated_article[field] = getattr(article_instance, field)

        cache.set(cache_key, serialized_annotated_article, timeout=CACHE_TIMEOUT)

