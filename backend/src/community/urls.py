from community.views import ArticleViewSet, CommentViewSet
from rest_framework.routers import DefaultRouter
from django.urls import path, include


router = DefaultRouter()

router.register(r"article", ArticleViewSet, basename="article")
router.register(r"comment", CommentViewSet, basename="comment")


urlpatterns = [
    path("", include(router.urls)),
]
