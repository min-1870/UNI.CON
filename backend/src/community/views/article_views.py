from community.utils import (
    ArticleResponseSerializer,
    get_set_temp_name_static_points,
    update_user_viewed_article_cache,
    update_user_saved_article_cache,
    update_user_liked_article_cache,
    update_user_posted_article_cache,
    get_paginated_notifications,
    update_recent_article_cache,
    update_preference_vector,
    get_serialized_article,
    add_embedding_to_faiss,
    get_paginated_comments,
    get_paginated_articles,
    add_notification,
    get_faiss_index,
    update_article,
    get_embedding,

)
from community.constants import (
    DELETED_BODY,
    DELETED_TITLE,
    TRENDING_TAGS,
    CACHE_TIMEOUT,
)
from community.models import Article, ArticleLike, Tag, ArticleView, ArticleSave
from community.permissions import Article_IsAuthenticated
from community.serializers import ArticleSerializer
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import viewsets, status
from django.db.models import F, Q, Count
from django.http import JsonResponse
from django.core.cache import cache
from django.db import transaction
from django.urls import resolve
from urllib.parse import quote
from decouple import config
import boto3   

class ArticleViewSet(viewsets.ModelViewSet):

    permission_classes = [Article_IsAuthenticated]
    serializer_class = ArticleSerializer

    def get_queryset(self):
        user_instance = self.request.user

        # Filter articles based on user's school or if the article is unicon
        queryset = Article.objects.filter(
            Q(user__school=user_instance.school) | Q(unicon=True)
        )

        return queryset

    def create(self, request, *args, **kwargs):

        # Create the article
        user_instance = self.request.user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        article_instance = serializer.instance

        # Add the embedding to faiss
        add_embedding_to_faiss(
            get_faiss_index(),
            article_instance.embedding_vector,
            article_instance.id,
        )

        # Add article id to the cache
        update_user_posted_article_cache(request, article_instance)
        update_recent_article_cache(request, article_instance)

        # Add extra properties for the response
        get_set_temp_name_static_points(
            article_instance, user_instance
        )

        return Response({"detail":"The article has been created.", 'id': article_instance.id}, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):

        response_data = get_paginated_articles(
            request=request,
            queryset=self.get_queryset(),
            sort_by="created_at",
            cache_key=str(request.user.school.id) + "_" + resolve(request.path).view_name,
        )

        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def hot(self, request):

        response_data = get_paginated_articles(
            request=request,
            queryset=self.get_queryset(),
            sort_by="engagement_score",
            cache_key=str(request.user.school.id) + "_" + resolve(request.path).view_name,
        )

        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def preference(self, request):

        response_data = get_paginated_articles(
            request=request,
            queryset=self.get_queryset(),
            sort_by="embedding_result",
            cache_key=str(request.user.id) + "_" + resolve(request.path).view_name,
            embedding_vector=request.user.embedding_vector
        )

        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def search(self, request):
        # Block if the body or the title is empty
        search_content = request.GET.get("search_content", "").strip()
        if len(search_content) == 0:
            return Response(
                {"detail": "The search_content is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_data = get_paginated_articles(
            request=request,
            queryset=self.get_queryset(),
            sort_by="embedding_result",
            cache_key=str(request.user.school.id) + "_" + resolve(request.path).view_name + "_" + search_content,
            embedding_vector=get_embedding(search_content)
        )

        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def posted_articles(self, request, *args, **kwargs):

        response_data = get_paginated_articles(
            request=request,
            queryset=self.get_queryset().filter(user=request.user),
            sort_by="created_at",
            cache_key=str(request.user.id) + "_" + resolve(request.path).view_name,
        )

        return Response(response_data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"])
    def commented_articles(self, request, *args, **kwargs):

        response_data = get_paginated_articles(
            request=request,
            queryset=self.get_queryset().filter(comment__user=request.user).distinct(),
            sort_by="created_at",
            cache_key=str(request.user.id) + "_" + resolve(request.path).view_name,
        )

        return Response(response_data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"])
    def saved_articles(self, request, *args, **kwargs):

        response_data = get_paginated_articles(
            request=request,
            queryset=self.get_queryset().filter(articlesave__user=request.user),
            sort_by="created_at",
            cache_key=str(request.user.id) + "_" + resolve(request.path).view_name,
        )

        return Response(response_data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"])
    def liked_articles(self, request, *args, **kwargs):

        response_data = get_paginated_articles(
            request=request,
            queryset=self.get_queryset().filter(articlelike__user=request.user),
            sort_by="created_at",
            cache_key=str(request.user.id) + "_" + resolve(request.path).view_name,
        )

        return Response(response_data, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        return Response(
            {"detail": "This action is not allowed."}, status=status.HTTP_403_FORBIDDEN
        )

    def partial_update(self, request, *args, **kwargs):
        article_instance = self.get_object()

        # Block the modification for the deleted object
        if article_instance.deleted:
            return Response(
                {"detail": "The article is deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Block if the body or the title is not in the request
        if ("body" not in request.data.keys()) or ("title" not in request.data.keys()):
            return Response(
                {"detail": "The property is missing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Block if the body or the title is empty
        title = request.data.get("title", "").strip()
        body = request.data.get("body", "").strip()
        if len(body) == 0 or len(title) == 0:
            return Response(
                {"detail": "The title or body is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update the article instance & shared article attributes cache
        updated_fields = {"title": title, "body": body, "edited": True}
        update_article(article_instance, updated_fields)

        return Response({"detail":"The article has been updated by user."}, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        user_instance = request.user
        article_instance = self.get_object()

        # Update user preference based on the embedding of article
        updated_preference_vector = update_preference_vector(
            user_instance.embedding_vector, article_instance.embedding_vector
        )
        Article.objects.filter(pk=article_instance.id).update(embedding_vector=updated_preference_vector)

        # Create relational data
        with transaction.atomic():
            ArticleView.objects.get_or_create(
                user=user_instance, article=article_instance
            )
        
        # Update the article instance & shared article attributes cache
        updated_fields = {"views_count": F("views_count") + 1}
        update_article(article_instance, updated_fields)

        # update the user specific cache
        update_user_viewed_article_cache(request, article_instance)

        # Fetch the article response data
        article_response_data = get_serialized_article(request, article_instance)
        comments_response_data = get_paginated_comments(request, article_instance)
        comments_response_data["results"]["article"] = article_response_data

        return Response(comments_response_data)

    def destroy(self, request, *args, **kwargs):
        article_instance = self.get_object()

        # Block the modification for the deleted object
        if article_instance.deleted:
            return Response(
                {"detail": "The article is deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Update the article instance & shared article attributes cache
        updated_fields = {"title": DELETED_TITLE, "body": DELETED_BODY, "deleted": True}
        update_article(article_instance, updated_fields)

        return Response({"detail":"The article has been deleted by user."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[Article_IsAuthenticated])
    def save(self, request, pk=None):

        article_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        with transaction.atomic():
            _, created = ArticleSave.objects.get_or_create(
                user=user_instance, article=article_instance
            )
        if not created:
            return Response(
                {"detail": "The article already saved by the user."},
                status=status.HTTP_304_NOT_MODIFIED,
            )
        
        # Set save status cache
        update_user_saved_article_cache(request, article_instance, True)

        return Response({"detail":"The article has been saved."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[Article_IsAuthenticated])
    def unsave(self, request, pk=None):

        article_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        with transaction.atomic():
            _, deleted = ArticleSave.objects.filter(
                user=user_instance, article=article_instance
            ).delete()
        if not deleted:
            return Response(
                {"detail": "The article already unsaved by the user."},
                status=status.HTTP_304_NOT_MODIFIED,
            )
        
        # Set save status cache
        update_user_saved_article_cache(request, article_instance, False)

        return Response({"detail":"The article has been removed from saved articles."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[Article_IsAuthenticated])
    def like(self, request, pk=None):

        article_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        with transaction.atomic():
            _, created = ArticleLike.objects.get_or_create(
                user=user_instance, article=article_instance
            )
        if not created:
            return Response(
                {"detail": "The article already liked by the user."},
                status=status.HTTP_304_NOT_MODIFIED,
            )
        
        # Update the article instance & shared article attributes cache
        updated_fields = {"likes_count": F("likes_count") + 1}
        update_article(article_instance, updated_fields)

        # update the user specific cache
        update_user_liked_article_cache(request, article_instance, True)

        # Add notification
        if article_instance.user != user_instance:
            add_notification(
                1,
                article_instance.user,
                Article,
                article_instance.id
            )

        return Response({"detail":"The article has been liked by user."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[Article_IsAuthenticated])
    def unlike(self, request, pk=None):

        article_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        with transaction.atomic():
            _, deleted = ArticleLike.objects.filter(
                user=user_instance, article=article_instance
            ).delete()
        if not deleted:
            return Response(
                {"detail": "The article already unliked by the user."},
                status=status.HTTP_304_NOT_MODIFIED,
            )
        
        # Update the article instance & shared article attributes cache
        updated_fields = {"likes_count": F("likes_count") - 1}
        update_article(article_instance, updated_fields)

        # update the user specific cache
        update_user_liked_article_cache(request, article_instance, False)

        return Response({"detail":"The article has been unliked by user."}, status=status.HTTP_200_OK)


    @action(detail=False, methods=["get"])
    def trending_tags(self, request, *args, **kwargs): 

        cached = cache.get(TRENDING_TAGS(request.user.school.id))
        if True:#not cached:
            tag_queryset = Tag.objects.filter(
                    articletag__article__user__school=request.user.school,
                    articletag__article__deleted=False
                ).annotate(
                    use_count=Count('articletag')
                ).order_by('-use_count')[:5]
            tags = [tag.name for tag in tag_queryset]
            print(tags)
            print('----------------')
            all_tags = Tag.objects.filter(
                articletag__article__user__school=request.user.school
            ).values_list('name')
            print(all_tags)
            all_tags = Tag.objects.all().values_list('name', flat=True)
            print(all_tags)
            cache.set(TRENDING_TAGS(request.user.school.id), tags, CACHE_TIMEOUT)

        return Response({"tags":tags}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"])
    def new_notifications(self, request, *args, **kwargs):            
        
        response_data = get_paginated_notifications(
            request,
            True
        )
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"])
    def old_notifications(self, request, *args, **kwargs):            
        
        response_data = get_paginated_notifications(
            request,
            False
        )
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def get_s3_upload_url(self, request, *args, **kwargs):
        
        file_name = request.query_params.get('file_name')
        file_type = request.query_params.get('file_type')
        
        if not file_name or not file_type:
            return JsonResponse({'error': 'missing file_name or file_type'}, status=400)

        s3 = boto3.client(
            's3',
            aws_access_key_id=config("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=config("AWS_SECRET_ACCESS_KEY"),
            region_name=config("AWS_S3_REGION_NAME"),
        )

        # generate presigned PUT URL
        url = s3.generate_presigned_url(
            ClientMethod='put_object',
            Params={
                'Bucket': config("AWS_STORAGE_BUCKET_NAME"),
                'Key': file_name,
                'ContentType': file_type,
                # 'ACL': 'public-read',
            },
            ExpiresIn=3600  
        )
        file_name = quote(file_name, safe='')
        return Response({
            'uploadUrl': url,
            'publicUrl': f"https://{config("AWS_STORAGE_BUCKET_NAME")}.s3.{config("AWS_S3_REGION_NAME")}.amazonaws.com/{file_name}"
        }, status=status.HTTP_200_OK)