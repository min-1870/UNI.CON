from .cache_utils import (
    cache_serialized_article,
    cache_paginated_articles,
    cache_serialized_comment,
    cache_paginated_comments
)
from .database_utils import (
    annotate_comments,
    annotate_comment,
)
from .embedding_utils import (
    get_faiss_index,
    search_similar_embeddings,
    get_embedding,
    update_preference_vector,
)
from .permissions import Article_IsAuthenticated, Comment_IsAuthenticated
from .constants import (
    DELETED_BODY,
    DELETED_TITLE,
    ARTICLES_CACHE_KEY,
    ARTICLES_LIKE_CACHE_KEY,
    CACHE_TIMEOUT,
)
from .models import Article, Comment, ArticleLike, CommentLike
from .serializer import ArticleSerializer, CommentSerializer
from rest_framework.pagination import PageNumberPagination
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

        comments_response_data = cache_paginated_comments(
            request, article_instance
        )

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

        # Set like cache
        cache_key = ARTICLES_LIKE_CACHE_KEY(user_instance.id)
        user_liked_articles = cache.get(cache_key, None)
        if user_liked_articles is None:
            user_liked_articles = ArticleLike.objects.filter(
                user=user_instance
            ).values_list("article", flat=True)
            user_liked_articles = {pk: True for pk in user_liked_articles}
        user_liked_articles[article_instance.id] = True
        cache.set(cache_key, user_liked_articles, CACHE_TIMEOUT)

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

        # Set like cache
        cache_key = ARTICLES_LIKE_CACHE_KEY(user_instance.id)
        user_liked_articles = cache.get(cache_key, None)
        if user_liked_articles is None:
            user_liked_articles = ArticleLike.objects.filter(
                user=user_instance
            ).values_list("article", flat=True)
            user_liked_articles = {pk: True for pk in user_liked_articles}
        user_liked_articles.pop(article_instance.id, None)
        cache.set(cache_key, user_liked_articles, CACHE_TIMEOUT)

        # Update the article attributes
        response_data = cache_serialized_article(
            request, article_instance, {"likes_count": F("likes_count") - 1}
        )
        return Response(response_data, status=status.HTTP_200_OK)


class CommentViewSet(viewsets.ModelViewSet):

    permission_classes = [Comment_IsAuthenticated]
    serializer_class = CommentSerializer

    def get_queryset(self):
        user = self.request.user

        # Filter articles based on user's school or if the article is unicon
        queryset = Comment.objects.filter(
            Q(user__school=user.school) | Q(article__unicon=True)
        )

        return queryset

    def list(self, request, *args, **kwargs):
        return Response(
            {"detail": "This action is not allowed."}, status=status.HTTP_403_FORBIDDEN
        )

    def update(self, request, *args, **kwargs):
        return Response(
            {"detail": "This action is not allowed."}, status=status.HTTP_403_FORBIDDEN
        )

    def partial_update(self, request, *args, **kwargs):
        comment_instance = self.get_object()
        user_instance = request.user

        # Block the modification for the deleted object
        if comment_instance.deleted:
            return Response(
                {"detail": "The article is deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Block if the body is not in the request
        if "body" not in request.data.keys():
            return Response(
                {"detail": "The body is missing."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Block if the body is empty
        body = request.data.get("body", "").strip()
        if len(body) == 0:
            return Response(
                {"detail": "The body is empty."}, status=status.HTTP_400_BAD_REQUEST
            )

        updated_fields = {"body":body, "edited":True}
        serialized_comment = cache_serialized_comment(comment_instance, updated_fields)

        return Response(serialized_comment, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        comment_instance = self.get_object()
        user_instance = request.user

        # Block the modification for the deleted object
        if comment_instance.deleted:
            return Response(
                {"detail": "The article is deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )        

        updated_fields = {"body":DELETED_BODY, "deleted":True}
        serialized_comment = cache_serialized_comment(comment_instance, updated_fields)

        return Response(serialized_comment, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        
        comment_instance = self.get_object()

        article_instance = comment_instance.article
        paginated_comments = cache_paginated_comments(request, article_instance, comment_instance)

        return Response(paginated_comments)

    @action(detail=True, methods=["post"], permission_classes=[Comment_IsAuthenticated])
    def like(self, request, pk=None):
        comment_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        _, created = CommentLike.objects.get_or_create(
            user=user_instance, comment=comment_instance
        )
        if not created:
            return Response(
                {"detail": "The comment already liked by the user."},
                status=status.HTTP_304_NOT_MODIFIED,
            )

        updated_fields = {"likes_count":F("likes_count") + 1}
        serialized_comment = cache_serialized_comment(comment_instance, updated_fields)

        return Response(serialized_comment, status=status.HTTP_200_OK)
        

    @action(detail=True, methods=["post"], permission_classes=[Comment_IsAuthenticated])
    def unlike(self, request, pk=None):
        comment_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        _, deleted = CommentLike.objects.filter(
            user=user_instance, comment=comment_instance
        ).delete()
        if not deleted:
            return Response(
                {"detail": "The comment already unliked by the user."},
                status=status.HTTP_304_NOT_MODIFIED,
            )

        updated_fields = {"likes_count":F("likes_count") - 1}
        serialized_comment = cache_serialized_comment(comment_instance, updated_fields)
        
        return Response(serialized_comment, status=status.HTTP_200_OK)
