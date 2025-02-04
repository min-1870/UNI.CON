from community.utils import (
    cache_serialized_comment,
    cache_paginated_comments,
    update_article_cache,
    add_cache_serialized_comment,
)
from community.permissions import Comment_IsAuthenticated
from community.serializers import CommentSerializer
from community.models import Comment, CommentLike
from community.constants import DELETED_BODY
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import viewsets, status
from django.db.models import F, Q


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

    def create(self, request, *args, **kwargs):

        # Create the comment
        user_instance = request.user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        comment_instance = serializer.instance

        # Update the article & comment's instance & cache
        updated_fields = {"comments_count": F("comments_count") + 1}
        update_article_cache(comment_instance.article, updated_fields)
        
        if comment_instance.parent_comment:
            cache_serialized_comment(
                request,
                comment_instance.parent_comment,
                {"comments_count": F("comments_count") + 1},
            )

        response_data = add_cache_serialized_comment(comment_instance, user_instance)
        return Response(response_data, status=status.HTTP_201_CREATED)

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

        updated_fields = {"body": body, "edited": True}
        serialized_comment = cache_serialized_comment(
            request, comment_instance, updated_fields
        )

        return Response(serialized_comment, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        comment_instance = self.get_object()

        # Block the modification for the deleted object
        if comment_instance.deleted:
            return Response(
                {"detail": "The article is deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated_fields = {"body": DELETED_BODY, "deleted": True}
        serialized_comment = cache_serialized_comment(
            request, comment_instance, updated_fields
        )

        return Response(serialized_comment, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):

        comment_instance = self.get_object()

        article_instance = comment_instance.article
        paginated_comments = cache_paginated_comments(
            request, article_instance, comment_instance
        )

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

        updated_fields = {"likes_count": F("likes_count") + 1}
        serialized_comment = cache_serialized_comment(
            request, comment_instance, updated_fields
        )

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

        updated_fields = {"likes_count": F("likes_count") - 1}
        serialized_comment = cache_serialized_comment(
            request, comment_instance, updated_fields
        )

        return Response(serialized_comment, status=status.HTTP_200_OK)
