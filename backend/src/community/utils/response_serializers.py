from community.models import Article, Comment, Notification
from rest_framework import serializers


class ArticleResponseSerializer(serializers.ModelSerializer):

    like_status = serializers.BooleanField(read_only=True)
    view_status = serializers.BooleanField(read_only=True)
    save_status = serializers.BooleanField(read_only=True)
    user_school = serializers.CharField(read_only=True)
    user_temp_name = serializers.CharField(read_only=True)
    user_static_points = serializers.IntegerField(read_only=True)
    tag = serializers.JSONField(required=False)

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
            "tag",
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
            # Not in Comment Model
            "like_status",
            "user_school",
            "user_temp_name",
            "user_static_points",
        ]

class NotificationResponseSerializer(serializers.ModelSerializer):

    title = serializers.CharField(read_only=True) # Title of the article or comment
    body = serializers.CharField(read_only=True) # Body of article or comment
    type_name = serializers.CharField(read_only=True)
    class Meta:
        model = Notification
        fields = [
            # In Notification Model
            "id",
            "group",
            "user",
            "created_at",
            "object_id",
            # Not in Notification Model
            "type_name",
            "title",
            "body",
        ]