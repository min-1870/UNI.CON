from rest_framework import permissions
from .models import Article, Comment


class Article_IsAuthenticated(permissions.BasePermission):
    """
    Allows access only to authenticated users.
    """

    def has_permission(self, request, view):

        # Block not validated user
        if not request.user.is_validated:
            return False

        # Block not authenticated user
        if not request.user.is_authenticated:
            return False

        return True

    def has_object_permission(self, request, view, obj):
        view_name = getattr(view, "action")
        author_only_actions = ["destroy", "partial_update"]
        same_school_only_actions = ["like", "unlike", "retrieve"]

        if view_name in author_only_actions:
            if obj.user == request.user:
                return True

        elif view_name in same_school_only_actions:
            # Allow if the article is UNI.CON

            if obj.unicon:
                return True

            # Block if the article is from other school
            if obj.user.school == request.user.school:
                return True

        return False


class Comment_IsAuthenticated(permissions.BasePermission):
    """
    Allows access only to authenticated users.
    """

    def has_permission(self, request, view):

        # Block not validated user
        if not request.user.is_validated:
            return False

        # Block not authenticated user
        if not request.user.is_authenticated:
            return False

        view_name = getattr(view, "action")
        if view_name == "create":
            # Allow if the article is UNI.CON
            article_instance = Article.objects.get(pk=request.data["article"])
            if article_instance.unicon:
                return True

            # Allow if the article is from other school
            if article_instance.user.school != request.user.school:
                return False

        return True

    def has_object_permission(self, request, view, obj):
        view_name = getattr(view, "action")
        author_only_actions = ["destroy", "partial_update"]
        same_school_only_actions = ["like", "unlike", "retrieve"]

        if view_name in author_only_actions:
            if obj.user == request.user:
                return True

        elif view_name in same_school_only_actions:
            # Allow if the article is UNI.CON
            if obj.article.unicon:
                return True

            # Allow if the article is from other school
            if obj.user.school == request.user.school:
                return True

        return False
