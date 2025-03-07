from community.utils import (
    ArticleResponseSerializer,
    get_set_temp_name_static_points,
    update_user_viewed_article_cache,
    update_user_saved_article_cache,
    update_user_liked_article_cache,
    search_similar_embeddings,
    update_preference_vector,
    add_embedding_to_faiss,
    get_faiss_index,
    get_embedding,
    get_paginated_articles,
    get_serialized_article,
    update_article,
    get_paginated_comments,
    get_paginated_notifications,
    add_notification,
)
from community.constants import (
    DELETED_BODY,
    DELETED_TITLE,
    ARTICLES_CACHE_KEY,
    CACHE_TIMEOUT,
)
from community.models import Article, ArticleLike, Course, ArticleCourse, ArticleView, ArticleSave, Comment
from community.permissions import Article_IsAuthenticated
from community.serializers import ArticleSerializer
from django.db.models import Case, When, F, Q
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import viewsets, status
from django.core.cache import cache
from django.urls import resolve
from django.db import transaction


class ArticleViewSet(viewsets.ModelViewSet):

    permission_classes = [Article_IsAuthenticated]
    serializer_class = ArticleSerializer

    def get_queryset(self):
        user_instance = self.request.user

        # Filter articles based on user's school or if the article is unicon
        queryset = Article.objects.filter(
            Q(user__school=user_instance.school) | Q(unicon=True)
        )

        return queryset

    def create(self, request, *args, **kwargs):

        # Create the article
        user_instance = self.request.user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        article_instance = serializer.instance

        # Add the embedding to faiss
        add_embedding_to_faiss(
            get_faiss_index(),
            article_instance.embedding_vector,
            article_instance.id,
        )

        # Link the foreign key for each course code if necessary
        course_code = request.data.get("course_code")
        if len(course_code) != 0:
            with transaction.atomic():
                for code in course_code:
                    course_instance, _ = Course.objects.get_or_create(
                        code=code.upper().strip(), school=user_instance.school
                    )
                    ArticleCourse.objects.create(
                        article=article_instance, course=course_instance
                    )

            article_instance.course_code = [code.upper().strip() for code in course_code]
        else:
            article_instance.course_code = []

        # Add article id to the cache
        cache_key = ARTICLES_CACHE_KEY(user_instance.school.id, "article-list")
        article_ids = cache.get(cache_key)
        if article_ids:
            article_ids.insert(0, article_instance.id)
            cache.set(cache_key, article_ids, CACHE_TIMEOUT)

        # Add extra properties for the response
        user_temp_name, user_static_points = get_set_temp_name_static_points(
            article_instance, user_instance
        )
        article_instance.user_temp_name = user_temp_name
        article_instance.user_static_points = user_static_points
        article_instance.user_school = user_instance.school
        article_instance.like_status = False

        # Custom response
        article_response_data = ArticleResponseSerializer(article_instance).data
        return Response(article_response_data, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):

        response_data = get_paginated_articles(
            request,
            self.get_queryset(),
            ARTICLES_CACHE_KEY(request.user.school.id, resolve(request.path).view_name),
        )

        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def hot(self, request):

        response_data = get_paginated_articles(
            request,
            self.get_queryset().order_by("-engagement_score"),
            ARTICLES_CACHE_KEY(request.user.school.id, resolve(request.path).view_name),
        )

        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def preference(self, request):
        user_instance = request.user

        # Fetch Ids of the article based on the similarity
        ids = search_similar_embeddings(
            get_faiss_index(), user_instance.embedding_vector, len(self.get_queryset())
        )

        # Fetch the article based on the fetched id while maintaining the order
        order = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(ids)])
        queryset = self.get_queryset().filter(pk__in=ids).order_by(order)

        response_data = get_paginated_articles(
            request,
            queryset,
            ARTICLES_CACHE_KEY(
                user_instance.school.id, resolve(request.path).view_name, user_instance.id
            ),
        )

        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def search(self, request):
        # Block if the body or the title is empty
        search_content = request.GET.get("search_content", "").strip()
        if len(search_content) == 0:
            return Response(
                {"detail": "The search_content is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get embedding vectors for the search keywords
        embedding_vector = get_embedding(search_content)

        # Fetch Ids of the article based on the similarity
        ids = search_similar_embeddings(
            get_faiss_index(), embedding_vector, len(self.get_queryset())
        )

        # Fetch the article based on the fetched id while maintaining the order
        order = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(ids)])
        queryset = self.get_queryset().filter(pk__in=ids).order_by(order)

        user_instance = request.user
        response_data = get_paginated_articles(
            request,
            queryset,
            ARTICLES_CACHE_KEY(
                user_instance.school.id, resolve(request.path).view_name, search_content
            ),
        )

        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def posted_articles(self, request, *args, **kwargs):        
        
        response_data = get_paginated_articles(
            request,
            self.get_queryset().filter(user=request.user),
            ARTICLES_CACHE_KEY(request.user.school.id, resolve(request.path).view_name, request.user.id),
        )

        return Response(response_data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"])
    def commented_articles(self, request, *args, **kwargs):            

        response_data = get_paginated_articles(
            request,
            self.get_queryset().filter(comment__user=request.user).distinct(),
            ARTICLES_CACHE_KEY(request.user.school.id, resolve(request.path).view_name, request.user.id),
        )

        return Response(response_data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"])
    def saved_articles(self, request, *args, **kwargs):            

        response_data = get_paginated_articles(
            request,
            self.get_queryset().filter(articlesave__user=request.user),
            ARTICLES_CACHE_KEY(request.user.school.id, resolve(request.path).view_name, request.user.id),
        )

        return Response(response_data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"])
    def liked_articles(self, request, *args, **kwargs):            
        
        response_data = get_paginated_articles(
            request,
            self.get_queryset().filter(articlelike__user=request.user),
            ARTICLES_CACHE_KEY(request.user.school.id, resolve(request.path).view_name, request.user.id),
        )

        return Response(response_data, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        return Response(
            {"detail": "This action is not allowed."}, status=status.HTTP_403_FORBIDDEN
        )

    def partial_update(self, request, *args, **kwargs):
        article_instance = self.get_object()

        # Block the modification for the deleted object
        if article_instance.deleted:
            return Response(
                {"detail": "The article is deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Block if the body or the title is not in the request
        if ("body" not in request.data.keys()) or ("title" not in request.data.keys()):
            return Response(
                {"detail": "The property is missing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Block if the body or the title is empty
        title = request.data.get("title", "").strip()
        body = request.data.get("body", "").strip()
        if len(body) == 0 or len(title) == 0:
            return Response(
                {"detail": "The title or body is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update the article instance & shared article attributes cache
        updated_fields = {"title": title, "body": body, "edited": True}
        update_article(article_instance, updated_fields)

        return Response({"detail":"The article has been updated by user."}, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        user_instance = request.user
        article_instance = self.get_object()

        # Update user preference based on the embedding of article
        updated_preference_vector = update_preference_vector(
            user_instance.embedding_vector, article_instance.embedding_vector
        )
        Article.objects.filter(pk=article_instance.id).update(embedding_vector=updated_preference_vector)

        # Create relational data
        with transaction.atomic():
            ArticleView.objects.get_or_create(
                user=user_instance, article=article_instance
            )
        
        # Update the article instance & shared article attributes cache
        updated_fields = {"views_count": F("views_count") + 1}
        update_article(article_instance, updated_fields)

        # update the user specific cache
        update_user_viewed_article_cache(request, article_instance)

        # Fetch the article response data
        article_response_data = get_serialized_article(request, article_instance)
        comments_response_data = get_paginated_comments(request, article_instance)
        comments_response_data["results"]["article"] = article_response_data

        return Response(comments_response_data)

    def destroy(self, request, *args, **kwargs):
        article_instance = self.get_object()

        # Block the modification for the deleted object
        if article_instance.deleted:
            return Response(
                {"detail": "The article is deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Update the article instance & shared article attributes cache
        updated_fields = {"title": DELETED_TITLE, "body": DELETED_BODY, "deleted": True}
        update_article(article_instance, updated_fields)

        return Response({"detail":"The article has been deleted by user."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[Article_IsAuthenticated])
    def save(self, request, pk=None):

        article_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        with transaction.atomic():
            _, created = ArticleSave.objects.get_or_create(
                user=user_instance, article=article_instance
            )
        if not created:
            return Response(
                {"detail": "The article already saved by the user."},
                status=status.HTTP_304_NOT_MODIFIED,
            )
        
        # Set save status cache
        update_user_saved_article_cache(request, article_instance, True)

        return Response({"detail":"The article has been saved."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[Article_IsAuthenticated])
    def unsave(self, request, pk=None):

        article_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        with transaction.atomic():
            _, deleted = ArticleSave.objects.filter(
                user=user_instance, article=article_instance
            ).delete()
        if not deleted:
            return Response(
                {"detail": "The article already unsaved by the user."},
                status=status.HTTP_304_NOT_MODIFIED,
            )
        
        # Set save status cache
        update_user_saved_article_cache(request, article_instance, False)

        return Response({"detail":"The article has been removed from saved articles."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[Article_IsAuthenticated])
    def like(self, request, pk=None):

        article_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        with transaction.atomic():
            _, created = ArticleLike.objects.get_or_create(
                user=user_instance, article=article_instance
            )
        if not created:
            return Response(
                {"detail": "The article already liked by the user."},
                status=status.HTTP_304_NOT_MODIFIED,
            )
        
        # Update the article instance & shared article attributes cache
        updated_fields = {"likes_count": F("likes_count") + 1}
        update_article(article_instance, updated_fields)

        # update the user specific cache
        update_user_liked_article_cache(request, article_instance, True)

        # Add notification
        if article_instance.user != user_instance:
            add_notification(
                1,
                article_instance.user,
                Article,
                article_instance.id
            )

        return Response({"detail":"The article has been liked by user."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[Article_IsAuthenticated])
    def unlike(self, request, pk=None):

        article_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        with transaction.atomic():
            _, deleted = ArticleLike.objects.filter(
                user=user_instance, article=article_instance
            ).delete()
        if not deleted:
            return Response(
                {"detail": "The article already unliked by the user."},
                status=status.HTTP_304_NOT_MODIFIED,
            )
        
        # Update the article instance & shared article attributes cache
        updated_fields = {"likes_count": F("likes_count") - 1}
        update_article(article_instance, updated_fields)

        # update the user specific cache
        update_user_liked_article_cache(request, article_instance, False)

        return Response({"detail":"The article has been unliked by user."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def new_notifications(self, request, *args, **kwargs):            
        
        response_data = get_paginated_notifications(
            request,
            True
        )
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"])
    def old_notifications(self, request, *args, **kwargs):            
        
        response_data = get_paginated_notifications(
            request,
            False
        )
        
        return Response(response_data, status=status.HTTP_200_OK)
