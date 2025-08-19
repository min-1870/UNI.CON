from community.constants import (
    ARTICLE_CACHE_KEY,
    
    LONG_CACHE_TIMEOUT,
    PAGINATOR_SIZE,
    CACHE_TIMEOUT,

    USER_LIKED_ARTICLES_KEY,
    USER_VIEWED_ARTICLES_KEY,
    USER_SAVED_ARTICLES_KEY,

    ARTICLE_FACETS_KEY,
    ARTICLE_IDS_KEY
)
from community.models import Article, ArticleUser, ArticleTag, ArticleLike, ArticleSave, Tag, ArticleView
from community.utils.database_utils import get_faiss_index, search_similar_embeddings
from .response_serializers import ArticleResponseSerializer
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import OuterRef, Subquery, Value
from django.db.models.functions import Coalesce
from django.db.models import Case, When
from .database_utils import to_unix_ms
from django.core.cache import cache
from django.db import transaction
from account.models import User
from decouple import config

from django.db.models import Q

demo = config("DEMO", default="False").lower() == "true"
if demo:
    from community.dummyRedis import DummyRedis
    redis_conn = DummyRedis()
else:
    from django_redis import get_redis_connection
    redis_conn = get_redis_connection("default")


def descriptor_from_params(params: dict):
    marketplace = bool(int(params.get("marketplace", "0")))
    unicon = bool(int(params.get("unicon", "0")))
    feed = params.get("feed")
    variable = params.get("variable")
    return {
        "marketplace": marketplace,
        "unicon": unicon,
        "feed": feed,
        "variable": variable,
    }

def base_queryset(desc, user_instance):
    qs = Article.objects.all()
    if desc["unicon"]:
        qs = qs.filter(
            Q(user__school_id=user_instance.school.id) | Q(unicon=True)
        )
    else:
        qs = qs.filter(user__school=user_instance.school.id)

    if desc["marketplace"]:
        qs = qs.filter(marketplace=True, unicon=False)
    else:
        qs = qs.filter(marketplace=False)

    if desc['feed'] == 'recent':
        qs = qs.order_by("-created_at")

    elif desc['feed'] == 'hot':
        qs = qs.order_by("-engagement_score")
    
    elif desc['feed'] == 'preference':
        if user_instance.embedding_vector is not None:
            # Use the Faiss index to get similar articles
            ids = search_similar_embeddings(get_faiss_index(), user_instance.embedding_vector, qs.count())
            preserved_order = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(ids)])
            qs = qs.filter(pk__in=ids).order_by(preserved_order)
        else:
            qs = qs.none()

    elif desc['feed'] == 'keyword':
        if desc['variable'] is not None and desc['variable'] != "":
            qs = qs.search(desc['variable'])
    
    elif desc['feed'] == 'tag':
        if desc['variable'] is not None and desc['variable'] != "":
            qs = qs.filter(articletag__tag__name__icontains=desc['variable']).distinct()
    
    elif desc['feed'] in ['liked', 'saved', 'posted', 'commented']:
        uid = user_instance.id
        feed = desc['feed']
        if feed == "liked":
            qs = qs.filter(articlelike__user_id=uid)
        elif feed == "saved":
            qs = qs.filter(articlesave__user_id=uid)
        elif feed == "posted":
            qs = qs.filter(user_id=uid)
        elif feed == "commented":
            qs = qs.filter(comment__user_id=uid).distinct()
    
            
    return qs

def materialize_items(desc, qs):
    """Return list[(id, score)] for building an index, and TTL."""
    feed = desc["feed"]

    if feed == "recent":
        ids_scores = qs.values_list("id", "created_at")
        mapping = {str(aid): to_unix_ms(time) for aid, time in ids_scores}
        return mapping, LONG_CACHE_TIMEOUT
    
    if feed == "hot":
        ids_scores = qs.values_list("id", "engagement_score")
        mapping = {str(aid): float(score) for aid, score in ids_scores}
        return mapping, LONG_CACHE_TIMEOUT
    
    if feed == "preference":
        ids = qs.values_list("id", flat=True)
        mapping = {str(aid): len(ids)-idx for idx, aid in enumerate(ids)}
        return mapping, CACHE_TIMEOUT
    
    if feed == "keyword":
        ids = qs.values_list("id", flat=True)
        mapping = {str(aid): len(ids)-idx for idx, aid in enumerate(ids)}
        return mapping, CACHE_TIMEOUT
    
    if feed == "tag":
        ids_scores = qs.values_list("id", "created_at")
        mapping = {str(aid): to_unix_ms(time) for aid, time in ids_scores}
        return mapping, LONG_CACHE_TIMEOUT
    
    ids_scores = qs.values_list("id", "created_at")
    mapping = {str(aid): to_unix_ms(time) for aid, time in ids_scores}
    return mapping, LONG_CACHE_TIMEOUT

def get_facet_keys(facets, user_instance):
    keys = []
    for facet_type, facet_val in facets.items():
        if facet_type == 'unicon':
            # Special case for unicon facet
            keys.append(ARTICLE_FACETS_KEY(
                [facet_type, 'school_id'],
                [str(facet_val), str(user_instance.school.id)]
            ))
        elif facet_type == 'marketplace':
            # Special case for unicon facet
            keys.append(ARTICLE_FACETS_KEY(
                [facet_type, 'school_id'],
                [str(facet_val), str(user_instance.school.id)]
            ))
        elif facet_type == 'feed':
            # Special case for unicon facet
            if facet_val in ['liked', 'saved', 'posted', 'commented']:
                keys.append(ARTICLE_FACETS_KEY(
                    [facet_type, 'user_id'],
                    [str(facet_val), str(user_instance.id)]
                ))
            elif facet_val in ['tag', 'keyword']:
                keys.append(ARTICLE_FACETS_KEY(
                    [facet_type, 'school_id', 'variable'],
                    [str(facet_val), str(user_instance.school.id), str(facets.get('variable', ''))]
                ))
            else:
                # General case for other facets
                keys.append(ARTICLE_FACETS_KEY(
                    [facet_type, 'school_id'],
                    [str(facet_val), str(user_instance.school.id)]
                ))
    return keys

def bump_facet_version(facets, user_instance):
    key = get_facet_keys(facets, user_instance)[0]
    # Increment the version in Redis
    current_version = redis_conn.incr(key)
    if current_version == 1:
        # Set the key to expire after a long time if it's the first increment
        redis_conn.expire(key, LONG_CACHE_TIMEOUT)

def update_article_action(action_type, add, user_instance, article_instance):
    if action_type == 'liked':
        cache_key = USER_LIKED_ARTICLES_KEY(user_instance.id)
    elif action_type == 'viewed':
        cache_key = USER_VIEWED_ARTICLES_KEY(user_instance.id)
    elif action_type == 'saved':
        cache_key = USER_SAVED_ARTICLES_KEY(user_instance.id)
    else:
        raise ValueError("Invalid action type")
    if add:
        redis_conn.sadd(cache_key, article_instance.id)
    else:
        redis_conn.srem(cache_key, article_instance.id)

def get_facet_versions(facets, user_instance):
    keys = get_facet_keys(facets, user_instance)
            
    # Default to 1 if missing
    versions = []
    for v in redis_conn.mget(*keys):
        versions.append(v.decode() if v else "1")
    return versions

def make_list_cache_key(facets, user_instance):
    versions = get_facet_versions(facets, user_instance)
    facet_str = ":".join(f"{t}={v}" for t, v in facets.items())
    version_str = "-".join(versions)
    return ARTICLE_IDS_KEY(facet_str, version_str)

def get_articles(request):
    user_instance = request.user
    params = request.query_params
    desc = descriptor_from_params(params)
    list_cache_key = request.query_params.get("list_cache_key", None)
    if list_cache_key is None:
        list_cache_key = make_list_cache_key(desc, user_instance)
    # Check if the list cache exists
    if not redis_conn.exists(list_cache_key):
        # Materialize the items and set the cache
        qs = base_queryset(desc, user_instance)
        mapping, timeout = materialize_items(desc, qs)
        if len(mapping) == 0:
            # If no articles found, return empty response
            return {
                "next": None,
                "results": {"articles": []},
            }
        redis_conn.zadd(list_cache_key, mapping)
        redis_conn.expire(list_cache_key, timeout)
    
    
    # Fetch the paginated articles from the cache
    requested_page = int(request.query_params.get("page", 1))
    raw_ids = redis_conn.zrevrangebyscore(
        list_cache_key,
        max=float('inf'),
        min=0,
        start=(requested_page - 1) * PAGINATOR_SIZE,
        num=PAGINATOR_SIZE + 1,
    )
    ids = [int(i.decode()) for i in raw_ids]

    # If no enough articles found, do not provide next page
    moreArticles = False
    if len(ids) == PAGINATOR_SIZE + 1:
        ids.pop()
        moreArticles = True
    
    # Bulk get article from cache
    cache_keys = [ARTICLE_CACHE_KEY(nid) for nid in ids]
    cached = cache.get_many(cache_keys)

    raw_articles = {}
    missing_ids = []
    for nid in ids:
        key = ARTICLE_CACHE_KEY(nid)
        serialized_article = cached.get(key)
        if serialized_article is None:
            missing_ids.append(nid)
            raw_articles[nid] = None
        else:
            raw_articles[nid] = serialized_article

    missing_annotated_article_queryset = {}
    if len(missing_ids) > 0:
        # Query all of the missing article ids
        missing_annotated_article_queryset = Article.objects.all().filter(pk__in=missing_ids).annotate(
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
    liked_flags = redis_conn.smismember(USER_LIKED_ARTICLES_KEY(user_instance.id), *ids)
    if liked_flags is None:
        user_liked_articles = ArticleLike.objects.filter(user=user_instance, article__in=ids).values_list(
            "article", flat=True
        )
        user_liked_articles = {pk: True for pk in user_liked_articles}
        redis_conn.sadd(USER_LIKED_ARTICLES_KEY(user_instance.id), *user_liked_articles.keys())
        liked_flags = [user_liked_articles.get(pk, False) for pk in ids]
    liked_ids = dict(zip(ids, map(bool, liked_flags)))

    # Cache user view status and save status in bulk
    viewed_flags = redis_conn.smismember(USER_VIEWED_ARTICLES_KEY(user_instance.id), *ids)
    if viewed_flags is None:
        user_viewed_articles = ArticleView.objects.filter(user=user_instance, article__in=ids).values_list(
            "article", flat=True
        )
        user_viewed_articles = {pk: True for pk in user_viewed_articles}
        redis_conn.sadd(USER_VIEWED_ARTICLES_KEY(user_instance.id), *user_viewed_articles.keys())
        viewed_flags = [user_viewed_articles.get(pk, False) for pk in ids]
    viewed_ids = dict(zip(ids, map(bool, viewed_flags)))

    # Cache user save status in bulk
    saved_flags = redis_conn.smismember(USER_SAVED_ARTICLES_KEY(user_instance.id), *ids)
    if saved_flags is None:
        user_saved_articles = ArticleSave.objects.filter(user=user_instance, article__in=ids).values_list(
            "article", flat=True
        )
        user_saved_articles = {pk: True for pk in user_saved_articles}
        redis_conn.sadd(USER_SAVED_ARTICLES_KEY(user_instance.id), *user_saved_articles.keys())
        saved_flags = [user_saved_articles.get(pk, False) for pk in ids]
    saved_ids = dict(zip(ids, map(bool, saved_flags)))
    
    articles = []
    for aid, article in raw_articles.items():
        if article is None:
            article = missing_serialized_annotated_articles.get(ARTICLE_CACHE_KEY(aid), None)

        if article is None:
            continue  # Skip if article is still None

        # Attach user specific data
        article["like_status"] = liked_ids.get(article["id"], False)
        # Cache user view status in bulk
        article["view_status"] = viewed_ids.get(article["id"], False)
        # Cache user save status in bulk
        article["save_status"] = saved_ids.get(article["id"], False)

        articles.append(article)
    
    if moreArticles:
        url = request.build_absolute_uri()
        next_page = f"{url.split('?')[0]}?{url.split('?')[1]}&page={requested_page + 1}"
        if requested_page == 2:
            next_page = f"{next_page}&list_cache_key={list_cache_key}"
        
    else:
        next_page = None
    return {
        "next": next_page,
        "results": {"articles": articles},
    }

def get_article(request, article_instance):
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
    
    # Cache user like status
    like_status = redis_conn.sismember(USER_LIKED_ARTICLES_KEY(user_instance.id), article_instance.id)
    if like_status is None:
        user_liked_articles = ArticleLike.objects.filter(user=user_instance, article=article_instance).exists()
        redis_conn.sadd(USER_LIKED_ARTICLES_KEY(user_instance.id), article_instance.id)
        like_status = user_liked_articles
    serialized_annotated_article["like_status"] = like_status
    # Cache user view status
    view_status = redis_conn.sismember(USER_VIEWED_ARTICLES_KEY(user_instance.id), article_instance.id)
    if view_status is None:
        user_viewed_articles = ArticleView.objects.filter(user=user_instance, article=article_instance).exists()
        redis_conn.sadd(USER_VIEWED_ARTICLES_KEY(user_instance.id), article_instance.id)
        view_status = user_viewed_articles
    serialized_annotated_article["view_status"] = view_status
    # Cache user save status
    save_status = redis_conn.sismember(USER_SAVED_ARTICLES_KEY(user_instance.id), article_instance.id)
    if save_status is None:
        user_saved_articles = ArticleSave.objects.filter(user=user_instance, article=article_instance).exists()
        redis_conn.sadd(USER_SAVED_ARTICLES_KEY(user_instance.id), article_instance.id)
        save_status = user_saved_articles
    serialized_annotated_article["save_status"] = save_status
    return serialized_annotated_article

def update_article(article_instance, updated_fields):
    """Update article instance with the provided fields."""

    if "tags" in updated_fields:
        new_tags = updated_fields.pop("tags")
        old_tags = ArticleTag.objects.filter(article=article_instance).values_list(
            "tag__name", flat=True
        )
        old_tags = list(old_tags) if old_tags else []
        
        if set(old_tags) != set(new_tags):
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

    # Start an atomic transaction for database updates
    with transaction.atomic():
        # Update attributes for updated fields in the permanent database
        Article.objects.filter(pk=article_instance.id).update(**updated_fields)
        article_instance.refresh_from_db()
    
    # invalidate the cache
    cache_key = ARTICLE_CACHE_KEY(article_instance.id)
    if cache.get(cache_key, None):
        cache.delete(cache_key)
