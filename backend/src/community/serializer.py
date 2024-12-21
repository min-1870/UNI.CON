from .models import Article, Course, Comment, ArticleCourse, ArticleUser
from .embedding_utils import get_embedding, add_embedding_to_faiss
from .database_utils import get_current_user_points
from rest_framework import serializers
from randomname import get_name
from django.db.models import F


class ArticleSerializer(serializers.ModelSerializer):

    like_status = serializers.BooleanField(read_only=True)
    user_school = serializers.CharField(read_only=True)
    user_temp_name = serializers.CharField(read_only=True)
    user_static_points = serializers.IntegerField(read_only=True)
    course_code = serializers.JSONField(required=False)
    search_content = serializers.CharField(required=False)

    class Meta:
        model = Article
        fields = [
            # In Article Model
            # Read Only
            "id",
            "user",
            "created_at",
            "views_count",
            "comments_count",
            "likes_count",
            "deleted",
            "edited",
            # Read & Write
            "title",
            "body",
            "unicon",
            # Not in Article Model
            # Read Only
            "like_status",
            "user_school",
            "user_static_points",
            "user_temp_name",
            # Read & Write
            "course_code",
            # Write Only
            "search_content",
        ]

        read_only_fields = (
            "id",
            "user",
            "created_at",
            "views_count",
            "comments_count",
            "likes_count",
        )

        extra_kwargs = {
            "title": {"required": True},
            "body": {"required": True},
            "unicon": {"required": True},
            "course_code": {"required": True},
        }

    def validate(self, data):

        # Validate the whitespace of the title
        title = data.get("title", "").strip()
        if not title:
            raise serializers.ValidationError("The title cannot be empty.")

        # Validate the whitespace of the body
        body = data.get("body", "").strip()
        if not body:
            raise serializers.ValidationError("The body cannot be empty.")

        # Validate the course code is not included for the unicon article
        if data["unicon"] and len(data["course_code"]) != 0:
            raise serializers.ValidationError(
                "The article with the course code does not support unicon option."
            )

        return data

    def create(self, validated_data):

        # Link the foreign key
        user_instance = self.context["request"].user
        validated_data["user"] = user_instance
        course_code = validated_data.get("course_code")
        del validated_data["course_code"]

        # Calculate and save the embedding vector
        validated_data["embedding_vector"] = get_embedding(
            validated_data["title"] + validated_data["body"]
        )

        # Save the new article
        article_instance = Article.objects.create(**validated_data)

        # Add the embedding to faiss
        add_embedding_to_faiss(article_instance.embedding_vector, article_instance.id)

        # Create the temporary username for the author
        user_temp_name = get_name()
        user_static_points = get_current_user_points(user_instance.id)
        ArticleUser.objects.create(
            user_temp_name=user_temp_name,
            user_static_points=user_static_points,
            user=user_instance,
            article=article_instance,
        )

        # Link the foreign key for each course code if necessary
        if len(course_code) != 0:
            for code in course_code:
                course_instance, _ = Course.objects.get_or_create(
                    code=code.upper().strip(), school=user_instance.school
                )
                ArticleCourse.objects.create(
                    article=article_instance, course=course_instance
                )

            article_instance.course_code = [
                code.upper().strip() for code in course_code
            ]
        else:
            article_instance.course_code = []

        # Add extra properties for the response
        article_instance.user_temp_name = user_temp_name
        article_instance.user_static_points = user_static_points
        article_instance.user_school = user_instance.school
        article_instance.like_status = False

        return article_instance


class CommentSerializer(serializers.ModelSerializer):

    like_status = serializers.BooleanField(read_only=True)
    user_school = serializers.CharField(read_only=True)
    user_temp_name = serializers.CharField(read_only=True)
    user_static_points = serializers.IntegerField(read_only=True)

    class Meta:
        model = Comment
        fields = [
            # In Comment Model
            # Read Only
            "id",
            "user",
            "created_at",
            "comments_count",
            "likes_count",
            "deleted",
            "edited",
            # Read & Write
            "body",
            "article",
            "parent_comment",
            # Not in Article Model
            # Read Only
            "like_status",
            "user_school",
            "user_temp_name",
            "user_static_points",
        ]

        read_only_fields = (
            "id",
            "user",
            "created_at",
            "comments_count",
            "likes_count",
        )

        extra_kwargs = {
            "body": {"required": True},
        }

    def validate(self, data):

        # Validate the whitespace of the body
        body = data.get("body", "").strip()
        if not body:
            raise serializers.ValidationError("The body cannot be empty.")

        # Check the validation of the article
        exist = Article.objects.filter(pk=data["article"].id).exists()
        if not exist:
            raise serializers.ValidationError("Invalid article.")

        # Check the depth of the comment
        if data.get("parent_comment", False):
            exist = Comment.objects.filter(pk=data["parent_comment"].id).exists()
            if not exist:
                raise serializers.ValidationError("Invalid comment.")

            # Check the level is over the limit
            parent_comment_instance = Comment.objects.get(pk=data["parent_comment"].id)

            if not (parent_comment_instance.parent_comment is None):
                raise serializers.ValidationError("Invalid comment.")

        return data

    def create(self, validated_data):

        # Update the article instance
        article_instance = Article.objects.get(pk=validated_data["article"].id)
        article_instance.comments_count = F("comments_count") + 1
        article_instance.save(update_fields=["comments_count"])

        # Link the foreign key of the new comment
        user_instance = self.context["request"].user
        validated_data["user"] = user_instance
        validated_data["article"] = article_instance

        # Add parent comment instance to the ForeignKey if necessary
        if validated_data.get("parent_comment", False):

            # Save the parent_comment's id
            parent_comment_instance = Comment.objects.get(
                pk=validated_data["parent_comment"].id
            )
            validated_data["parent_comment"] = parent_comment_instance

            # Update the comments_count of the parent_comment
            parent_comment_instance.comments_count = F("comments_count") + 1
            parent_comment_instance.save(update_fields=["comments_count"])

        # Save the new comment
        comment_instance = Comment.objects.create(**validated_data)

        # Create the temporary username of the author if necessary
        if not ArticleUser.objects.filter(
            user=user_instance, article=article_instance
        ).exists():
            user_temp_name = get_name()
            user_static_points = get_current_user_points(user_instance.id)
            ArticleUser.objects.create(
                user=user_instance,
                article=article_instance,
                user_temp_name=user_temp_name,
                user_static_points=user_static_points,
            )
        else:
            article_user_instance = ArticleUser.objects.get(
                user=user_instance, article=article_instance
            )
            user_temp_name = article_user_instance.user_temp_name
            user_static_points = article_user_instance.user_static_points

        # Add the extra properties
        comment_instance.user_temp_name = user_temp_name
        comment_instance.user_static_points = user_static_points
        comment_instance.user_school = user_instance.school.initial
        comment_instance.like_status = False

        return comment_instance
