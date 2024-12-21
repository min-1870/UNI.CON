from rest_framework import permissions


class User_IsAuthenticated(permissions.BasePermission):
    """
    Allows access only to authenticated users.
    """

    def has_permission(self, request, view):

        view_name = getattr(view, "action")
        if view_name in ["validate", "create", "login"]:
            return True

        # Block not validated user
        if not request.user.is_validated:
            return False

        # Block not authenticated user
        if not request.user.is_authenticated:
            return False

        return True
