from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet, CommentViewSet

router = DefaultRouter()

router.register(r'article', ArticleViewSet, basename='article')
router.register(r'comment', CommentViewSet, basename='comment')


urlpatterns = [
    path('', include(router.urls)),
]