from .models import Article, Comment
from django.db.models import Sum, F, Count, Q
from django.db.models import F, Q
from decouple import config
import numpy as np
from openai import OpenAI
import faiss


def update_article_engagement_score(article_instance):
    article_instance.engagement_score = (
        (F('views_count') * 1) +
        (F('likes_count') * 2) +
        (F('comments_count') * 3)
    )
    
    article_instance.save(update_fields=['engagement_score'])

def get_embedding(text, model="text-embedding-3-small"):
   text = text.replace("\n", " ")
   return client.embeddings.create(input = [text], model=model).data[0].embedding

def calculate_similarity(vector_1, vector_2):
    return np.dot(vector_1, vector_2) / (np.linalg.norm(vector_1) * np.linalg.norm(vector_2))

def update_preference_vector(user_embeddings, article_embedding, alpha=0.1):
    user_embeddings = np.array(user_embeddings)  
    article_embedding = np.array(article_embedding)    
    return ((1 - alpha) * user_embeddings + alpha * article_embedding).tolist()

def add_embedding_to_faiss(article_embedding, article_id):
    article_embedding = np.array([article_embedding])
    article_id = np.array([article_id])
    index.add_with_ids(article_embedding, article_id)
    faiss.write_index(index, "index.idx")    

def search_similar_embeddings(embedding, k=100):
    _, ids = index.search(np.array([embedding]), k=k)
    return ids[0]

def get_current_user_points(user_id):

    # Filter articles by the user and sum the counts
    article_points = Article.objects.filter(user=user_id).annotate(
        # Count the comments and the likes by the author
        author_comments=Count(
            'comment',
            filter=Q(comment__user=F('user'))
        ),
        author_likes=Count(
            'articlelike',
            filter=Q(articlelike__user=F('user'))
        )
    ).aggregate(
        # Sum the total comments and the likes while ignore number by the author
        total_views=Sum('views_count'),
        total_comments=Sum(F('comments_count') * 3) - Sum('author_comments') * 3,
        total_likes=Sum(F('likes_count') * 2) - Sum('author_likes') * 2
    )    
    
    # Filter comment by the user and sum the counts
    comment_points = Comment.objects.filter(user=user_id).annotate(
        # Count the comments and the likes by the author
        author_comments=Count(
            'comment',
            filter=Q(comment__user=F('user'))
        ),
        author_likes=Count(
            'commentlike',
            filter=Q(commentlike__user=F('user'))
        )
    ).aggregate(
        # Sum the total comments and the likes while ignore number by the author
        total_comments=Sum(F('comments_count') * 3) - Sum('author_comments') * 3,
        total_likes=Sum(F('likes_count') * 2) - Sum('author_likes') * 2
    )

    # Calculate the sum of all counts
    total_points = (
        (article_points['total_views'] or 0) +
        (article_points['total_comments'] or 0) +
        (article_points['total_likes'] or 0) +
        (comment_points['total_comments'] or 0) +
        (comment_points['total_likes'] or 0)
    )

    return total_points


client = OpenAI(
    api_key=config("OPENAI_API_KEY")
)

def reset_faiss():
    index.reset()

try:
    index = faiss.read_index("index_file.idx")
except Exception:
    index = faiss.IndexFlatL2(1536)
    index = faiss.IndexIDMap(index)
    for article_instance in Article.objects.all():
        add_embedding_to_faiss(article_instance.embedding_vector, article_instance.id)
        
# INITIAL_ARTICLE_SCORE_GRAVITY = 1.8
# ARTICLE_SCORE_GRAVITY_RESET_MINUTES = 5
# VIEWED_FORUM_GRAVITY_INC_RATE = 1.1
# MAXIMUM_ARTICLE_SCORE_GRAVITY = 3
# VIEWED_ARTICLE_SCORE_PENALTY_RATE = 0.5

# CACHE_TIMEOUT = 300


# '''
# Refactor functions for forum algorithm
# '''
# def get_forum_view(view, forum_instance):
#     now = timezone.now()
#     user_instance = view.request.user
    
#     # Fetch and update the user gravity and viewed_at
#     forum_view_instance, created = ForumView.objects.get_or_create(
#         forum=forum_instance, 
#         user=user_instance,
#         defaults={'gravity': INITIAL_ARTICLE_SCORE_GRAVITY, 'viewed_at': now}
#     )
        
#     if not created:
#         if forum_view_instance.viewed_at <= now - timedelta(minutes=ARTICLE_SCORE_GRAVITY_RESET_MINUTES):
#             forum_view_instance.gravity = INITIAL_ARTICLE_SCORE_GRAVITY
#         else:
#             forum_view_instance.gravity = min(round(forum_view_instance.gravity * VIEWED_FORUM_GRAVITY_INC_RATE, 3), MAXIMUM_ARTICLE_SCORE_GRAVITY)
    
#     forum_view_instance.viewed_at = now
#     forum_view_instance.save()
    
#     return forum_view_instance 

# def apply_pagination(article_queryset, request):

#     paginator = PageNumberPagination()
#     paginator.page_size = PAGINATION_SIZE['forum']

#     # Apply pagination to the comments queryset
#     paginated_articles = paginator.paginate_queryset(article_queryset, request)
#     article_serializer = ArticleSerializer(paginated_articles, many=True)

#     return paginator.get_paginated_response({
#         'articles': article_serializer.data
#     })

# def apply_like_status_view_time(user_instance, forum_instance, article_queryset):
#     liked_article_ids = get_or_set_cache(
#         LIKED_ARTICLE_IDS_KEY(forum_instance.id, user_instance.id),
#         lambda: list(ArticleLike.objects.filter(article__forum=forum_instance, user=user_instance).values_list('id', flat=True))
#     )

#     article_queryset = article_queryset.annotate(
#         view_time=Subquery(ArticleView.objects.filter(article=OuterRef('id'), user=user_instance).values('viewed_at')[:1]),
#         like_status=Case(
#             When(
#                     id__in=liked_article_ids, 
#                     then=True
#                 ), 
#             default=False, 
#             output_field=BooleanField()
#         ),
#     )

#     return article_queryset


# '''
# Cache keys and refactor functions
# '''
# def remove_cache(view, user_instance=False, article_instance=False, forum_instance=False, comment_instance=False, parent_comment_id=False):
#     view_name = view.__class__.__name__
#     action_name = view.action
    
#     if view_name == 'ArticleViewSet':
#         if action_name == 'perform_create': #forum
#             cache.delete(ARTICLE_QUERYSET_KEY(forum_instance.id))
            
#         if action_name in ['partial_update', 'destroy']: #article

#             if article_instance.forum.name == 'outback':
#                 cache.delete(ARTICLE_QUERYSET_KEY(article_instance.forum.id))
#             else:
#                 cache.delete(ARTICLE_QUERYSET_KEY(article_instance.forum.id, article_instance.user.school.id))

#         if action_name in ['like', 'unlike']: #article, user

#             if article_instance.forum.name == 'outback':
#                 cache.delete(ARTICLE_QUERYSET_KEY(article_instance.forum.id))
#             else:
#                 cache.delete(ARTICLE_QUERYSET_KEY(article_instance.forum.id, article_instance.user.school.id))

#             cache.delete(ARTICLE_LIKES_COUNT_KEY(article_instance.id))
#             cache.delete(ARTICLE_LIKE_STATUS_KEY(article_instance.id, user_instance.id))

#     elif view_name == 'CommentViewSet':
#         if action_name == 'perform_create': #article, parent_comment_id

#             if article_instance.forum.name == 'outback':
#                 cache.delete(ARTICLE_QUERYSET_KEY(article_instance.forum.id))
#             else:
#                 cache.delete(ARTICLE_QUERYSET_KEY(article_instance.forum.id, article_instance.user.school.id))

#             cache.delete(TOP_COMMENT_QUERYSET_KEY(article_instance.id))
#             if parent_comment_id:
#                 cache.delete(NESTED_COMMENT_QUERYSET_KEY(parent_comment_id))

#         if action_name in ['partial_update', 'destroy']: #comment
#             if comment_instance.parent_comment is None:
#                 cache.delete(TOP_COMMENT_QUERYSET_KEY(comment_instance.article.id))
#             else:
#                 cache.delete(NESTED_COMMENT_QUERYSET_KEY(comment_instance.parent_comment.id))

#         if action_name in ['like', 'unlike']: #comment, user
#             if comment_instance.parent_comment is None:
#                 cache.delete(TOP_COMMENT_QUERYSET_KEY(comment_instance.article.id))
#                 cache.delete(LIKED_TOP_COMMENT_IDS_KEY(comment_instance.article.id, user_instance.id))
#             else:
#                 cache.delete(NESTED_COMMENT_QUERYSET_KEY(comment_instance.parent_comment.id))
#                 cache.delete(LIKED_NESTED_COMMENT_IDS_KEY(comment_instance.parent_comment.id, user_instance.id))

# def get_or_set_cache(key, set_function):
#     value = cache.get(key)
#     if value is None:
#         value = set_function()
#         cache.set(key, value, CACHE_TIMEOUT)
#     return value

# '''
# These cache keys are for ARTICLE RETRIEVE API
# '''
# # article_instance.author_id -> NO NEED
# ARTICLE_AUTHOR_ID_KEY = lambda article_id: f'ARTICLE_AUTHOR_ID_KEY_ARTICLE_{article_id}'

# # article_instance.author_username -> NO NEED
# ARTICLE_AUTHOR_USERNAME_KEY = lambda article_id: f'ARTICLE_AUTHOR_USERNAME_KEY_ARTICLE{article_id}'

# # article_instance.author_school -> NO NEED
# ARTICLE_AUTHOR_SCHOOL_KEY = lambda article_id: f'ARTICLE_AUTHOR_SCHOOL_KEY_ARTICLE_{article_id}'

# # article_instance.views_count ->RETRIEVES the ARTICLE
# ARTICLE_VIEWS_COUNT_KEY = lambda article_id: f'ARTICLE_VIEWS_COUNT_KEY_ARTICLE_{article_id}'

# # article_instance.likes_count ->LIKES or UNLIKES the ARTICLE
# ARTICLE_LIKES_COUNT_KEY = lambda article_id: f'ARTICLE_LIKES_COUNT_KEY_ARTICLE_{article_id}'

# # article_instance.like_state ->LIKES or UNLIKES the ARTICLE
# ARTICLE_LIKE_STATUS_KEY = lambda article_id, user_id: f'ARTICLE_LIKE_STATUS_KEY_ARTICLE_{article_id}_USER_{user_id}'

# # comment_instance -> CREATE, PATCHES or DELETES a TOP COMMENT under the ARTICLE
# # comment_instance.author_id
# # comment_instance.author_username
# # comment_instance.author_school
# # comment_instance.likes_count -> LIKES or UNLIKES a TOP COMMENT under the ARTICLE
# # comment_instance.nested_comments_count -> CREATES a NESTED COMMENT under the ARTICLE
# TOP_COMMENT_QUERYSET_KEY = lambda article_id: f'TOP_COMMENT_QUERYSET_KEY_ARTICLE_{article_id}'

# # Ids of user liked top comments -> LIKES or UNLIKES a TOP COMMENT under the ARTICLE
# LIKED_TOP_COMMENT_IDS_KEY = lambda article_id, user_id: f'LIKED_TOP_COMMENT_IDS_KEY_ARTICLE_{article_id}_USER_{user_id}'



# '''
# These cache keys are for NESTED COMMENTS RETRIEVE API
# '''
# # comment_instance -> CREATES, PATCHES or DELETES a NESTED COMMENT under the COMMENT
# # comment_instance.author_id
# # comment_instance.author_username
# # comment_instance.author_school
# # comment_instance.likes_count -> LIKES or UNLIKES a NESTED COMMENT under the COMMENT
# NESTED_COMMENT_QUERYSET_KEY = lambda parent_comment_id: f'NESTED_COMMENT_QUERYSET_KEY_PARENT_COMMENT_{parent_comment_id}'

# # Ids of user liked nested comments -> LIKES or UNLIKES a NESTED COMMENT under the COMMENT
# LIKED_NESTED_COMMENT_IDS_KEY = lambda parent_comment_id, user_id: f'LIKED_NESTED_COMMENT_IDS_KEY_PARENT_COMMENT_{parent_comment_id}_USER_{user_id}'


# '''
# These cache keys are for ARTICLES RETRIEVE API
# '''
# # article_instance -> CREATES, PATCHES or DELETES an ARTICLE in the FORUM
# # article_instance.author_id
# # article_instance.author_username
# # article_instance.author_school
# # article_instance.views_count -> RETRIEVES an ARTICLE in the FORUM
# # article_instance.likes_count -> LIKES or UNLIKES an ARTICLE in the FORUM
# # article_instance.comments_count -> CREATES a COMMENT in the ARTICLE
# ARTICLE_QUERYSET_KEY = lambda forum_id, school_id=-1: f'ARTICLE_QUERYSET_KEY_FORUM_{forum_id}_SCHOOL_{school_id}'

# # Ids of user liked article -> LIKES or UNLIKES an ARTICLE in the FORUM
# LIKED_ARTICLE_IDS_KEY = lambda forum_id, user_id: f'LIKED_ARTICLE_IDS_KEY_FORUM_{forum_id}_USER_{user_id}'




# SUBSCRIBED_COURSE_IDS_KEY = lambda user_id: f'SUBSCRIBED_COURSE_IDS_KEY_USER_{user_id}'