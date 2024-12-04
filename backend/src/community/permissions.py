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
        

        # For the like or unlike article view
        view_name = getattr(view, 'action')
        if view_name in ['retrieve', 'like', 'unlike']:
            pk = view.kwargs.get('pk', False)
            if pk:
                article_instance = Article.objects.get(pk=pk)

                # Accept all for UNI.CON
                if article_instance.unicon:
                    return True
            
                # Block like or unlike article from other school
                if article_instance.user.school != request.user.school:
                    return False

        return True

    def has_object_permission(self, request, view, obj): #GET, PUT, PATCH, or DELETE
        # For the Safe Methods
        if request.method in permissions.SAFE_METHODS:
            
            # Allow if the article is UNI.CON
            if obj.unicon:
                return True

            # Block if the article is from other school
            if obj.user.school != request.user.school:
                return False
            
            return True
        
        # Not for the Safe Methods
        else:
            if obj.user == request.user:
                return True
            else:
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
        
        # For the create comment view
        view_name = getattr(view, 'action')
        if view_name == 'create':
            article_id = request.data.get('article')
            article_instance = Article.objects.get(pk=article_id)

            # Accept all for UNI.CON
            if article_instance.unicon:
                return True
            
            # Block like or unlike comment from other school
            if article_instance.user.school != request.user.school:
                return False
            
        # For the like or unlike view
        if view_name == 'like' or view_name == 'unlike':
            pk = view.kwargs.get('pk', False)
            if pk:
                comment_instance = Comment.objects.get(pk=pk)

                # Accept all for UNI.CON
                if comment_instance.article.unicon:
                    return True
            
                # Block like or unlike comment from other school
                if comment_instance.article.user.school != request.use.school:
                    return False

        return True

    def has_object_permission(self, request, view, obj):
        # For the Safe Methods
        if request.method in permissions.SAFE_METHODS:
            # Allow if the article is UNI.CON
            if obj.article.unicon:
                return True

            # Block if the article is from other school
            if obj.user.school != request.user.school:
                return False
            
            return True
        
        # Not for the Safe Methods
        else:
            if obj.user == request.user:
                return True
            else:
                return False