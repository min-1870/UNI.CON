from django.core.cache import cache
from .serializer import ArticleSerializer
from .constants import CACHE_TIMEOUT
from .models import ArticleUser, ArticleCourse

def get_set_serialized_annotated_article_caches(serialized_articles, paginated_article_instances):
    # Gather the Article Ids for the pagination
    article_ids = [f'article_{article['id']}' for article in serialized_articles]
        
    serialized_annotated_articles = []
    set_many_serialized_annotated_articles = {}

    # Cache the additional article ids
    serialized_annotated_article_caches = cache.get_many(article_ids)

    for i, serialized_article in enumerate(serialized_articles):
            
        # Check the cache hit
        cache_key = f'article_{serialized_article['id']}'
        serialized_annotated_article = serialized_annotated_article_caches.get(cache_key, False)

        # If the cache missed
        if not serialized_annotated_article:
            
            # Make an annotated_article to set the cache
            article_instance = paginated_article_instances[i]
            serialized_annotated_article = ArticleSerializer(annotate_article(article_instance)).data

            set_many_serialized_annotated_articles[cache_key] = serialized_annotated_article
            
        # Attache the user specific attribute
        serialized_annotated_article['like_status'] = serialized_article['like_status']

        serialized_annotated_articles.append(serialized_annotated_article)
    
    cache.set_many(set_many_serialized_annotated_articles, timeout=CACHE_TIMEOUT)
    
    return serialized_annotated_articles

def get_set_serialized_annotated_article_cache(serialized_article, article_instance, updated_fields=[]):

    # Cache the annotated article
    cache_key = f'article_{serialized_article['id']}'
    serialized_annotated_article = cache.get(cache_key)

    # If the cache missed
    if not serialized_annotated_article:

        # Make an annotated_article to set the cache
        serialized_annotated_article = ArticleSerializer(annotate_article(article_instance)).data
        cache.set(cache_key, serialized_annotated_article, timeout=CACHE_TIMEOUT)
    
    # If the cache is hit but there are updated data
    elif updated_fields:

        # Store the updated data to the cache
        for updated_field in updated_fields:
            serialized_annotated_article[updated_field] = updated_fields[updated_field]
        cache.set(cache_key, serialized_annotated_article, timeout=CACHE_TIMEOUT)
    
    # Attache the user specific attribute
    serialized_annotated_article['like_status'] = serialized_article['like_status']

    return serialized_annotated_article

def annotate_article(article_instance):
    
    article_instance.user_school = article_instance.user.school.initial

    articleUser_instance = ArticleUser.objects.get(
        article=article_instance,
        user=article_instance.user
    )
    article_instance.user_temp_name = articleUser_instance.user_temp_name
    article_instance.user_static_points = articleUser_instance.user_static_points

    course_codes = ArticleCourse.objects.filter(article=article_instance).values_list('course__code', flat=True)
    article_instance.course_code = ', '.join(course_codes) if course_codes else ''
    
    return article_instance