from community.utils import (
    cache_serialized_article,
    cache_paginated_articles,
    cache_paginated_comments,
    get_faiss_index,
    search_similar_embeddings,
    get_embedding,
    update_preference_vector,
    add_embedding_to_faiss,
    get_set_temp_name_static_points,
    ArticleResponseSerializer,
    cache_user_liked_articles,
    cache_user_viewed_articles,
    cache_user_saved_articles,
)
from community.constants import (
    DELETED_BODY,
    DELETED_TITLE,
    ARTICLES_CACHE_KEY,
)
from community.models import Article, ArticleLike, Course, ArticleCourse, ArticleView, ArticleSave
from community.permissions import Article_IsAuthenticated
from community.serializers import ArticleSerializer
from django.db.models import Case, When, F, Q
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import viewsets, status
from django.core.cache import cache
from django.urls import resolve


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
            cache.set(cache_key, article_ids)

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

        response_data = cache_paginated_articles(
            request,
            self.get_queryset(),
        )

        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def hot(self, request):

        response_data = cache_paginated_articles(
            request,
            self.get_queryset().order_by("-engagement_score"),
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

        response_data = cache_paginated_articles(
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
        response_data = cache_paginated_articles(
            request,
            queryset,
            ARTICLES_CACHE_KEY(
                user_instance.school.id, resolve(request.path).view_name, search_content
            ),
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

        # Update the article attributes
        updated_fields = {"title": title, "body": body, "edited": True}
        response_data = cache_serialized_article(
            request, article_instance, updated_fields
        )
        return Response(response_data, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        user_instance = request.user
        article_instance = self.get_object()

        # Update user preference based on the embedding of article
        updated_preference_vector = update_preference_vector(
            user_instance.embedding_vector, article_instance.embedding_vector
        )
        user_instance.embedding_vector = updated_preference_vector
        user_instance.save(update_fields=["embedding_vector"])

        # Update the article attributes
        article_response_data = cache_serialized_article(
            request, article_instance, {"views_count": F("views_count") + 1}
        )

        # Create relational data
        ArticleView.objects.get_or_create(
            user=user_instance, article=article_instance
        )

        # Set view status cache
        cache_user_viewed_articles(user_instance, article_instance)

        comments_response_data = cache_paginated_comments(request, article_instance)

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

        # Update the article attributes
        updated_fields = {"title": DELETED_TITLE, "body": DELETED_BODY, "deleted": True}
        response_data = cache_serialized_article(
            request, article_instance, updated_fields
        )
        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[Article_IsAuthenticated])
    def save(self, request, pk=None):

        article_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        _, created = ArticleSave.objects.get_or_create(
            user=user_instance, article=article_instance
        )
        if not created:
            return Response(
                {"detail": "The article already saved by the user."},
                status=status.HTTP_304_NOT_MODIFIED,
            )
        
        # Set save status cache
        cache_user_saved_articles(user_instance, article_instance, True)

        return Response({"detail":"The article has been saved."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[Article_IsAuthenticated])
    def unsave(self, request, pk=None):

        article_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        _, deleted = ArticleSave.objects.get_or_create(
            user=user_instance, article=article_instance
        ).delete()
        if not deleted:
            return Response(
                {"detail": "The article already unsaved by the user."},
                status=status.HTTP_304_NOT_MODIFIED,
            )
        
        # Set save status cache
        cache_user_saved_articles(user_instance, article_instance, False)

        return Response({"detail":"The article has been removed from saved articles."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[Article_IsAuthenticated])
    def like(self, request, pk=None):

        article_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        _, created = ArticleLike.objects.get_or_create(
            user=user_instance, article=article_instance
        )
        if not created:
            return Response(
                {"detail": "The article already liked by the user."},
                status=status.HTTP_304_NOT_MODIFIED,
            )
        
        # Set like status cache
        cache_user_liked_articles(user_instance, article_instance, True)

        # Update the article attributes
        response_data = cache_serialized_article(
            request, article_instance, {"likes_count": F("likes_count") + 1}
        )
        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[Article_IsAuthenticated])
    def unlike(self, request, pk=None):

        article_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        _, deleted = ArticleLike.objects.filter(
            user=user_instance, article=article_instance
        ).delete()
        if not deleted:
            return Response(
                {"detail": "The article already unliked by the user."},
                status=status.HTTP_304_NOT_MODIFIED,
            )

        # Set like status cache
        cache_user_liked_articles(user_instance, article_instance, False)

        # Update the article attributes
        response_data = cache_serialized_article(
            request, article_instance, {"likes_count": F("likes_count") - 1}
        )
        return Response(response_data, status=status.HTTP_200_OK)
