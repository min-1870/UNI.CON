from .cache_utils import (
    get_set_serialized_annotated_article_caches,
    get_set_serialized_annotated_article_cache,
)
from .database_utils import (
    update_article_engagement_score,
    annotate_comments,
    annotate_comment,
)
from .embedding_utils import (
    search_similar_embeddings,
    get_embedding,
    update_preference_vector,
)
from .permissions import Article_IsAuthenticated, Comment_IsAuthenticated
from django.db.models import Case, When, F, Q, OuterRef, Subquery, Exists
from .models import Article, Comment, ArticleLike, CommentLike
from .serializer import ArticleSerializer, CommentSerializer
from rest_framework.pagination import PageNumberPagination
from .constants import DELETED_BODY, DELETED_TITLE
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import viewsets, status


class ArticleViewSet(viewsets.ModelViewSet):

    permission_classes = [Article_IsAuthenticated]
    serializer_class = ArticleSerializer

    def get_queryset(self):
        user_instance = self.request.user

        # Filter articles based on user's school or if the article is unicon
        queryset = Article.objects.filter(
            Q(user__school=user_instance.school) | Q(unicon=True)
        ).annotate(
            like_status=Exists(
                Subquery(
                    ArticleLike.objects.filter(
                        user=user_instance, article=OuterRef("pk")
                    )
                )
            )
        )

        return queryset

    def list(self, request, *args, **kwargs):
        user_instance = request.user

        paginator = PageNumberPagination()
        paginator.page_size = 10

        # Gather the Article Ids for the pagination
        paginated_article_instances = paginator.paginate_queryset(
            self.get_queryset(), request
        )
        article_serializer_data = self.serializer_class(
            paginated_article_instances, many=True
        ).data
        response_data = {
            "articles": get_set_serialized_annotated_article_caches(
                article_serializer_data, paginated_article_instances
            ),
        }

        return paginator.get_paginated_response(response_data)

    @action(detail=False, methods=["get"])
    def hot(self, request):
        user_instance = request.user

        # Set up pagination for articles
        paginator = PageNumberPagination()
        paginator.page_size = 10

        # Apply pagination to the articles queryset
        sorted_articles = self.get_queryset().order_by("-engagement_score")
        paginated_article_instances = paginator.paginate_queryset(
            sorted_articles, request
        )
        article_serializer_data = self.serializer_class(
            paginated_article_instances, many=True
        ).data
        response_data = {
            "articles": get_set_serialized_annotated_article_caches(
                article_serializer_data, paginated_article_instances
            ),
        }

        return paginator.get_paginated_response(response_data)

    @action(detail=False, methods=["get"])
    def preference(self, request):
        user_instance = request.user

        # Set up pagination for articles
        paginator = PageNumberPagination()
        paginator.page_size = 10

        # Fetch Ids of the article based on the similarity
        ids = search_similar_embeddings(
            user_instance.embedding_vector, len(self.get_queryset())
        )

        # Fetch the article based on the fetched id while maintaining the order
        order = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(ids)])
        articles = self.get_queryset().filter(pk__in=ids).order_by(order)

        # Apply pagination to the articles queryset
        paginated_article_instances = paginator.paginate_queryset(articles, request)
        article_serializer_data = self.serializer_class(
            paginated_article_instances, many=True
        ).data
        response_data = {
            "articles": get_set_serialized_annotated_article_caches(
                article_serializer_data, paginated_article_instances
            ),
        }

        return paginator.get_paginated_response(response_data)

    @action(detail=False, methods=["get"])
    def search(self, request):
        user_instance = request.user

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
        ids = search_similar_embeddings(embedding_vector, len(self.get_queryset()))

        # Fetch the article based on the fetched id while maintaining the order
        order = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(ids)])
        articles = self.get_queryset().filter(pk__in=ids).order_by(order)

        # Set up pagination for articles
        paginator = PageNumberPagination()
        paginator.page_size = 10

        # Apply pagination to the articles queryset
        paginated_article_instances = paginator.paginate_queryset(articles, request)
        article_serializer_data = self.serializer_class(
            paginated_article_instances, many=True
        ).data
        response_data = {
            "articles": get_set_serialized_annotated_article_caches(
                article_serializer_data, paginated_article_instances
            ),
        }

        return paginator.get_paginated_response(response_data)

    def update(self, request, *args, **kwargs):
        return Response(
            {"detail": "This action is not allowed."}, status=status.HTTP_403_FORBIDDEN
        )

    def partial_update(self, request, *args, **kwargs):
        user_instance = request.user
        article_instance = self.get_object()

        # Block the modification for the deleted object
        if article_instance.deleted:
            return Response(
                {"detail": "The article is deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Block if the body or the title is not in the request
        if (not "body" in request.data.keys()) or (not "title" in request.data.keys()):
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

        # Append new text to the existing body
        updated_fields = {"title": title, "body": body, "edited": True}
        article_instance.title = updated_fields["title"]
        article_instance.body = updated_fields["body"]
        article_instance.edited = updated_fields["edited"]
        article_instance.save(update_fields=updated_fields.keys())

        # fetch the updated instance
        article_instance.refresh_from_db()

        serialized_article = self.get_serializer(article_instance).data
        serialized_annotated_article = get_set_serialized_annotated_article_cache(
            serialized_article, article_instance, updated_fields
        )
        return Response(serialized_annotated_article)

    def retrieve(self, request, *args, **kwargs):
        user_instance = request.user
        article_instance = self.get_object()

        # Update views_count of the article
        article_instance.views_count = F("views_count") + 1
        article_instance.save(update_fields=["views_count"])

        # Update user preference based on the embedding of article
        updated_preference_vector = update_preference_vector(
            user_instance.embedding_vector, article_instance.embedding_vector
        )
        user_instance.embedding_vector = updated_preference_vector
        user_instance.save(update_fields=["embedding_vector"])

        # fetch the updated instance
        article_instance.refresh_from_db()

        # Update engagement score
        article_instance = update_article_engagement_score(article_instance)

        # Fetch the comments related to the article and parent_comment is null
        comment_queryset = Comment.objects.filter(
            article=article_instance, parent_comment__isnull=True
        ).order_by("-created_at")

        # Annotate extra properties to the comments
        comment_queryset = annotate_comments(comment_queryset, user_instance)

        # Set up pagination for comments
        paginator = PageNumberPagination()
        paginator.page_size = 10

        # Apply pagination to the comments queryset
        paginated_comment_instances = paginator.paginate_queryset(
            comment_queryset, request
        )
        serialized_comments = CommentSerializer(
            paginated_comment_instances, many=True
        ).data

        # Construct response using paginated response
        serialized_article = ArticleSerializer(article_instance).data
        serialized_annotated_article = get_set_serialized_annotated_article_cache(
            serialized_article,
            article_instance,
            {"views_count": article_instance.views_count},
        )
        return paginator.get_paginated_response(
            {"article": serialized_annotated_article, "comments": serialized_comments}
        )

    def destroy(self, request, *args, **kwargs):
        user_instance = request.user
        article_instance = self.get_object()

        # Block the modification for the deleted object
        if article_instance.deleted:
            return Response(
                {"detail": "The article is deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Remove and save original content
        updated_fields = {"title": DELETED_TITLE, "body": DELETED_BODY, "deleted": True}
        article_instance.title = updated_fields["title"]
        article_instance.body = updated_fields["body"]
        article_instance.deleted = updated_fields["deleted"]
        article_instance.save(update_fields=updated_fields.keys())

        # fetch the updated instance
        article_instance.refresh_from_db()

        # Construct the response using serializer
        serialized_article = self.get_serializer(article_instance).data
        serialized_annotated_article = get_set_serialized_annotated_article_cache(
            serialized_article, article_instance, updated_fields
        )
        return Response(serialized_annotated_article, status=status.HTTP_200_OK)

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

        # Update likes_count of the article
        article_instance.likes_count = F("likes_count") + 1
        article_instance.save(update_fields=["likes_count"])
        article_instance.like_status = True
        # fetch the updated instance
        article_instance.refresh_from_db()

        # Construct the response using serializer
        serialized_article = self.get_serializer(article_instance).data
        serialized_annotated_article = get_set_serialized_annotated_article_cache(
            serialized_article,
            article_instance,
            {
                "likes_count": article_instance.likes_count,
            },
        )
        return Response(serialized_annotated_article, status=status.HTTP_200_OK)

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

        # Update likes_count of the article
        article_instance.likes_count = F("likes_count") - 1
        article_instance.save(update_fields=["likes_count"])
        article_instance.like_status = False

        # fetch the updated instance
        article_instance.refresh_from_db()

        # Construct the response using serializer
        serialized_article = self.get_serializer(article_instance).data
        serialized_annotated_article = get_set_serialized_annotated_article_cache(
            serialized_article,
            article_instance,
            {
                "likes_count": article_instance.likes_count,
            },
        )
        return Response(serialized_annotated_article, status=status.HTTP_200_OK)


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
        if not "body" in request.data.keys():
            return Response(
                {"detail": "The body is missing."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Block if the body is empty
        body = request.data.get("body", "").strip()
        if len(body) == 0:
            return Response(
                {"detail": "The body is empty."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Append new text to the existing body
        comment_instance.body = body
        comment_instance.edited = True
        comment_instance.save(update_fields=["body", "edited"])

        # fetch the updated instance
        comment_instance.refresh_from_db()

        # Annotate the extra properties
        comment_instance = annotate_comment(comment_instance, user_instance)

        # Serialize the comment and return the response
        serializer = self.get_serializer(comment_instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        comment_instance = self.get_object()
        user_instance = request.user

        # Block the modification for the deleted object
        if comment_instance.deleted:
            return Response(
                {"detail": "The article is deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Remove and save original content
        comment_instance.body = DELETED_BODY
        comment_instance.deleted = True
        comment_instance.save(update_fields=["body", "deleted"])

        # fetch the updated instance
        comment_instance.refresh_from_db()

        # Annotate the extra properties
        comment_instance = annotate_comment(comment_instance, user_instance)

        # Serialize the comment and return the response
        serializer = self.get_serializer(comment_instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        user_instance = request.user
        comment_instance = self.get_object()

        # Fetch the nested comments related to the parent comment
        nested_comment_queryset = (
            self.get_queryset()
            .filter(
                parent_comment=comment_instance,
            )
            .order_by("-created_at")
        )

        # Annotate extra properties to the comments
        nested_comment_queryset = annotate_comments(
            nested_comment_queryset, user_instance
        )

        # Set up pagination for comments
        paginator = PageNumberPagination()
        paginator.page_size = 10

        # Apply pagination to the comments queryset
        paginated_comments = paginator.paginate_queryset(
            nested_comment_queryset, request
        )
        comment_serializer = CommentSerializer(paginated_comments, many=True)

        return paginator.get_paginated_response(
            {"nested_comments": comment_serializer.data}
        )

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

        # Update likes_count of the comment
        comment_instance.likes_count = F("likes_count") + 1
        comment_instance.save(update_fields=["likes_count"])

        # fetch the updated instance
        comment_instance.refresh_from_db()

        # Annotate the extra properties
        comment_instance = annotate_comment(comment_instance, user_instance)

        # Serialize the comment and return the response
        serializer = self.get_serializer(comment_instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

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

        # Update likes_count of the comment
        comment_instance.likes_count = F("likes_count") - 1
        comment_instance.save(update_fields=["likes_count"])

        # fetch the updated instance
        comment_instance.refresh_from_db()

        # Annotate the extra properties
        comment_instance = annotate_comment(comment_instance, user_instance)

        # Serialize the comment and return the response
        serializer = self.get_serializer(comment_instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
