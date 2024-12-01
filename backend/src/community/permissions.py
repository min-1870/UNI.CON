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

        # # Check if obj is an instance of Article
        # if isinstance(obj, Article):
        #     # Fetch forum of article
        #     forum_instance = obj.forum

        # elif isinstance(obj, Comment):
        #     # Fetch forum of comment's article
        #     forum_instance = obj.article.forum
            
        # else:
        #     return obj.user == request.user

        
        # # If the forum is not in the exception list, validate the school
        # if (not (forum_instance.name in ['outback'])) and (request.user.school != obj.user.school):
        #     return False
        
        # # If the request is a safe method (get, like, unlike), return true
        # if (request.method in permissions.SAFE_METHODS) or (view.action in ['like', 'unlike']):
        #     return True
        
        # return obj.user == request.user
        return True