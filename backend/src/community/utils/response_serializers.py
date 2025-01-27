from community.models import Article, Comment
from rest_framework import serializers


class ArticleResponseSerializer(serializers.ModelSerializer):

    like_status = serializers.BooleanField(read_only=True)
    view_status = serializers.BooleanField(read_only=True)
    save_status = serializers.BooleanField(read_only=True)
    user_school = serializers.CharField(read_only=True)
    user_temp_name = serializers.CharField(read_only=True)
    user_static_points = serializers.IntegerField(read_only=True)
    course_code = serializers.JSONField(required=False)

    class Meta:
        model = Article
        fields = [
            # In Article Model
            "id",
            "user",
            "created_at",
            "views_count",
            "comments_count",
            "likes_count",
            "deleted",
            "edited",
            "title",
            "body",
            "unicon",
            # Not in Article Model
            "like_status",
            "save_status",
            "view_status",
            "user_school",
            "user_static_points",
            "user_temp_name",
            "course_code",
        ]


class CommentResponseSerializer(serializers.ModelSerializer):

    like_status = serializers.BooleanField(read_only=True)
    user_school = serializers.CharField(read_only=True)
    user_temp_name = serializers.CharField(read_only=True)
    user_static_points = serializers.IntegerField(read_only=True)

    class Meta:
        model = Comment
        fields = [
            # In Comment Model
            "id",
            "user",
            "created_at",
            "comments_count",
            "likes_count",
            "deleted",
            "edited",
            "body",
            "article",
            "parent_comment",
            # Not in Article Model
            "like_status",
            "user_school",
            "user_temp_name",
            "user_static_points",
        ]
