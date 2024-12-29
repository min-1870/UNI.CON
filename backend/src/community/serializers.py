from community.models import Article, Comment
from community.utils import get_embedding
from rest_framework import serializers


class ArticleSerializer(serializers.ModelSerializer):
    course_code = serializers.JSONField(required=False)
    search_content = serializers.CharField(required=False)

    class Meta:
        model = Article
        fields = [
            # In Article Model
            "title",
            "body",
            "unicon",
            # Not in Article Model
            "course_code",
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

        del validated_data["course_code"]

        # Calculate and save the embedding vector
        validated_data["embedding_vector"] = get_embedding(
            validated_data["title"] + validated_data["body"]
        )

        # Save the new article
        article_instance = Article.objects.create(**validated_data)

        return article_instance


class CommentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Comment
        fields = [
            # In Comment Model
            "body",
            "article",
            "parent_comment",
        ]

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

        # Fetch article instance
        article_instance = Article.objects.get(pk=validated_data["article"].id)

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

        # Save the new comment
        comment_instance = Comment.objects.create(**validated_data)

        return comment_instance
