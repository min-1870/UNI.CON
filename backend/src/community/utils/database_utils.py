from community.models import Article, ArticleUser
from django.utils.dateparse import parse_datetime
from django_redis import get_redis_connection
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone
from randomname import get_name
from decouple import config
from openai import OpenAI
import numpy as np
import faiss

from community.constants import (
    EMBEDDING_VECTOR_SIZE,
    EMBEDDING_VECTOR_MODEL,
    ENV_OPENAI_API_KEY,
    INDEX_FILE_NAME,
    CACHE_TIMEOUT,
)

# --- Embedding Functions ---

client = OpenAI(api_key=config(ENV_OPENAI_API_KEY))

def get_faiss_index():
    try:
        index = faiss.read_index(INDEX_FILE_NAME)
    except Exception:
        index = faiss.IndexFlatL2(EMBEDDING_VECTOR_SIZE)
        index = faiss.IndexIDMap(index)
        for article_instance in Article.objects.all():
            add_embedding_to_faiss(
                index, article_instance.embedding_vector, article_instance.id
            )
    return index


def get_embedding(text, model=EMBEDDING_VECTOR_MODEL):
    text = text.replace("\n", " ")
    return client.embeddings.create(input=[text], model=model).data[0].embedding


def update_preference_vector(user_embeddings, article_embedding, alpha=0.1):
    user_embeddings = np.array(user_embeddings)
    article_embedding = np.array(article_embedding)
    return ((1 - alpha) * user_embeddings + alpha * article_embedding).tolist()


def add_embedding_to_faiss(article_instance):
    index = get_faiss_index()
    index.add_with_ids(
        np.array([article_instance.embedding_vector]), 
        np.array([article_instance.id])
    )
    faiss.write_index(index, INDEX_FILE_NAME)


def search_similar_embeddings(index, embedding, k=100):
    _, ids = index.search(np.array([embedding]), k=k)
    return ids[0]


def reset_faiss(index):  # This function only for testcases
    index.reset()
    for article_instance in Article.objects.all():
        add_embedding_to_faiss(
            index, article_instance.embedding_vector, article_instance.id
        )
    faiss.write_index(index, INDEX_FILE_NAME)

# --- Redis Functions ---

redis_conn = get_redis_connection("default")
def update_article_engagement_score(article_instance):
    redis_conn.sadd("articles:dirty", article_instance.id)

def update_user_points(user_instance, delta_points, increment=True): 
    # Update the user's points
    if increment:
        user_instance.points += delta_points
        user_instance.save(update_fields=["points"])
    else:
        user_instance.points -= delta_points
        user_instance.save(update_fields=["points"])

def update_sorted_ids_cache(instance, cache_key, status=True):
    if redis_conn.exists(cache_key):
        # Add the instance id to the cache only if it does not exist
        if not redis_conn.zscore(cache_key, str(instance.id)):
            if status:
                redis_conn.zadd(cache_key, {str(instance.id): to_unix_ms(instance.created_at)})
        else:
            if not status:
                redis_conn.zrem(cache_key, str(instance.id))    

def update_unsorted_ids_cache(instance, cache_key, status=True):
    cached = cache.get(cache_key, None)
    if cached:
        # Update the cache
        cached[instance.id] = status
        cache.set(cache_key, cached, CACHE_TIMEOUT)

# --- Else ---

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

def to_unix_ms(dt):
    if dt:
        if isinstance(dt, str):
            try:
                parsed_dt = parse_datetime(dt)
                if parsed_dt is not None:
                    dt = parsed_dt
                else:
                    dt = timezone.datetime.fromtimestamp(float(dt), tz=timezone.utc)
            except Exception:
                dt = timezone.now()
        if timezone.is_naive(dt):
            dt = dt.replace(tzinfo=timezone.utc)
        return int(dt.timestamp() * 1000)
    else:
        return int(timezone.now().timestamp() * 1000)