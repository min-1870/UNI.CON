from rest_framework import permissions
from .models import Article, Comment

class Custom_IsAuthenticated(permissions.BasePermission):
    """
    Allows access only to authenticated users.
    """

    def has_permission(self, request, view):
        if request.user.is_validated:
            return bool(request.user and request.user.is_authenticated)
        return False  

    def has_object_permission(self, request, view, obj):

        if obj.user == request.user:
            return True
        else:
            return False