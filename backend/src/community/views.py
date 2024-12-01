
from .models import Article, Comment, ArticleLike, CommentLike, ArticleCourse, ArticleUser
from rest_framework import viewsets
from .serializer import ArticleSerializer, CommentSerializer
from .permissions import Custom_IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.db.models import OuterRef, Subquery, Exists
from django.db.models import F, Q
from django.db.models.functions import Log
from .constants import update_article_engagement_score
from rest_framework.pagination import PageNumberPagination

class ArticleViewSet(viewsets.ModelViewSet):
    
    permission_classes = [Custom_IsAuthenticated]
    serializer_class = ArticleSerializer

    def get_queryset(self):
        user = self.request.user 
        
        # Filter articles based on user's school or if the article is unicon
        queryset = Article.objects.filter(
            Q(user__school=user.school) | Q(unicon=True)
        )
        
        return queryset

    def list(self, request, *args, **kwargs):
        user_instance = request.user

        # beginning_datetime = request.session.get('beginning_datetime', False)
        # articles_number = request.session.get('articles_number', False)
        # Fetch most recent articles
        # recent_articles_queryset = self.queryset.filter(created_at__lte=beginning_datetime)[:articles_number]

        # Set up pagination for articles
        paginator = PageNumberPagination()
        paginator.page_size = 10

        # Apply pagination to the comments queryset
        paginated_articles = paginator.paginate_queryset(self.get_queryset(), request)
        article_serializer = ArticleSerializer(paginated_articles, many=True)
        
        
        
        return paginator.get_paginated_response({
            'articles': article_serializer.data
        })

    def update(self, request, *args, **kwargs):
        return Response({'detail':'This action is not allowed.'}, status=status.HTTP_403_FORBIDDEN)

    def partial_update(self, request, *args, **kwargs):
        article_instance = self.get_object()
        new_text = request.data.get('body', '').strip()

        if new_text:

            # Append new text to the existing body
            article_instance.body = new_text
            article_instance.save(update_fields=['body'])

        # Serialize the article and return the response
        serializer = self.get_serializer(article_instance)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        user_instance = request.user
        article_instance = self.get_object()

        article_instance.user_school = user_instance.school.id
        articleUser_instance = ArticleUser.objects.get(
            article=article_instance,
            user=user_instance
        )

        article_instance.user_temp_name = articleUser_instance.user_temp_name
        article_instance.user_static_points = articleUser_instance.user_static_points

        course_codes = ArticleCourse.objects.filter(article=article_instance).values_list('course__code', flat=True)
        article_instance.course_code = list(course_codes)

        exist = ArticleLike.objects.filter(article=article_instance, user=user_instance).exists()
        article_instance.like_status = exist

        # Fetch the comments related to the article and parent_comment is null
        comment_queryset = Comment.objects.filter(
            article=article_instance, 
            parent_comment__isnull=True
        ).order_by('created_at')

        # Subquery to check if the user has liked the comment
        liked_comments = CommentLike.objects.filter(
            user=user_instance,
            comment=OuterRef('pk'),
            comment__article=article_instance,
            comment__parent_comment__isnull=True,
        )

        # Combined subquery to get both user_temp_name and user_static_points from the ArticleUser model
        user_info_subquery = ArticleUser.objects.filter(
            article=article_instance,
            user=OuterRef('user')
        ).values('user_temp_name', 'user_static_points')[:1]  # Get the first match

        # Annotate the queryset with the like_status using Exists
        comment_queryset = comment_queryset.annotate(
            like_status=Exists(liked_comments),
            user_school=F('user__school__id'),
            user_temp_name=Subquery(user_info_subquery.values('user_temp_name')[:1]),
            user_static_points=Subquery(user_info_subquery.values('user_static_points')[:1]),
        )       

        # Update views_count of the article
        article_instance.views_count = F('views_count') + 1
        article_instance.save(update_fields=['views_count'])

        # Update engagement score
        update_article_engagement_score(article_instance)

        # Fetch the updated instance
        article_instance = Article.objects.get(id=article_instance.id)

        # Set up pagination for comments
        paginator = PageNumberPagination()
        paginator.page_size = 10

        # Apply pagination to the comments queryset
        paginated_comments = paginator.paginate_queryset(comment_queryset, request)
        comment_serializer = CommentSerializer(paginated_comments, many=True)

        # Construct response using paginated response
        article_data = ArticleSerializer(article_instance).data
        return paginator.get_paginated_response({
            'article': article_data,
            'comments': comment_serializer.data
        })

    @action(detail=True, methods=['post'], permission_classes=[Custom_IsAuthenticated])
    def like(self, request, pk=None):

        article_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        _, created = ArticleLike.objects.get_or_create(user=user_instance, article=article_instance)
        if not created:
            return Response({'detail':'The article already liked by the user.'}, status=status.HTTP_304_NOT_MODIFIED)

        # Update likes_count of the article
        article_instance.likes_count = F('likes_count') + 1
        article_instance.save(update_fields=['likes_count'])

        # Update engagement score
        update_article_engagement_score(article_instance)

        return Response({'detail':'The article liked by the user.'}, status=status.HTTP_200_OK)  
    
    @action(detail=True, methods=['post'], permission_classes=[Custom_IsAuthenticated])
    def unlike(self, request, pk=None):

        article_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        _, deleted = ArticleLike.objects.filter(user=user_instance, article=article_instance).delete()
        if not deleted:
            return Response({'detail':'The article already unliked by the user.'}, status=status.HTTP_304_NOT_MODIFIED)

        # Update likes_count of the article
        article_instance.likes_count = F('likes_count') - 1
        article_instance.save(update_fields=['likes_count'])
        
        # Update engagement score
        update_article_engagement_score(article_instance)

        return Response({'detail':'The article liked by the user.'}, status=status.HTTP_200_OK)  

class CommentViewSet(viewsets.ModelViewSet):

    permission_classes = [Custom_IsAuthenticated]
    serializer_class = CommentSerializer
    queryset = Comment.objects.all()
    
    def list(self, request, *args, **kwargs):
        return Response({'detail':'This action is not allowed.'}, status=status.HTTP_403_FORBIDDEN)
    
    def update(self, request, *args, **kwargs):
        return Response({'detail':'This action is not allowed.'}, status=status.HTTP_403_FORBIDDEN)

    def partial_update(self, request, *args, **kwargs):
        comment_instance = self.get_object()
        new_text = request.data.get('body', '').strip()

        if new_text:

            # Append new text to the existing body
            comment_instance.body = new_text
            comment_instance.save(update_fields=['body'])

        # Serialize the comment and return the response
        serializer = self.get_serializer(comment_instance)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        comment_instance = self.get_object()        
        article_instance = Article.objects.get(pk=comment_instance.article.id)
        
        # Update the comments_count of the parent_comment
        parent_comment = comment_instance.parent_comment
        if parent_comment is not None:
            parent_comment.comments_count = F('comments_count') - 1  
            parent_comment.save(update_fields=['comments_count'])

        # Update the comments_count of article
        article_instance.comments_count = F('comments_count') - 1  
        article_instance.save(update_fields=['comments_count'])
        
        # Update engagement score
        update_article_engagement_score(article_instance)

        # Delete the comment
        comment_instance.delete()

        return Response({'detail':'The comment is deleted.'},status=status.HTTP_204_NO_CONTENT)

    def retrieve(self, request, *args, **kwargs):
        user_instance = request.user
        comment_instance = self.get_object()

        comment_instance.user_school = user_instance.school.id
        articleUser_instance = ArticleUser.objects.get(
            article=comment_instance.article,
            user=user_instance
        )

        comment_instance.user_temp_name = articleUser_instance.user_temp_name
        comment_instance.user_static_points = articleUser_instance.user_static_points

        exist = CommentLike.objects.filter(comment=comment_instance, user=user_instance).exists()
        comment_instance.like_status = exist

        # Fetch the nested comments related to the parent comment
        nested_comment_queryset = Comment.objects.filter(
            parent_comment=comment_instance,
        ).order_by('created_at')

        # Subquery to check if the user has liked the nested comment(s)
        liked_comments = CommentLike.objects.filter(
            user=user_instance,
            comment=OuterRef('pk'),
            comment__parent_comment=comment_instance,
        )

        # Combined subquery to get both user_temp_name and user_static_points from the ArticleUser model
        user_info_subquery = ArticleUser.objects.filter(
            article=comment_instance.article,
            user=OuterRef('user')
        ).values('user_temp_name', 'user_static_points')[:1]  # Get the first match

        # Annotate the queryset with the like_status using Exists
        nested_comment_queryset = nested_comment_queryset.annotate(
            like_status=Exists(liked_comments),
            user_school=F('user__school__id'),
            user_temp_name=Subquery(user_info_subquery.values('user_temp_name')[:1]),
            user_static_points=Subquery(user_info_subquery.values('user_static_points')[:1]),
        )       

        # Set up pagination for comments
        paginator = PageNumberPagination()
        paginator.page_size = 10

        # Apply pagination to the comments queryset
        paginated_comments = paginator.paginate_queryset(nested_comment_queryset, request)
        comment_serializer = CommentSerializer(paginated_comments, many=True)

        # Construct response using paginated response
        comment_data = CommentSerializer(comment_instance).data
        return paginator.get_paginated_response({
            'comment': comment_data,
            'nested_comments': comment_serializer.data
        })

    @action(detail=True, methods=['post'], permission_classes=[Custom_IsAuthenticated])
    def like(self, request, pk=None):

        comment_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        _, created = CommentLike.objects.get_or_create(user=user_instance, comment=comment_instance)
        if not created:
            return Response({'detail':'The comment already liked by the user.'}, status=status.HTTP_304_NOT_MODIFIED)

        # Update likes_count of the comment
        comment_instance.likes_count = F('likes_count') + 1
        comment_instance.save(update_fields=['likes_count'])

        return Response({'detail':'The comment liked by the user.'}, status=status.HTTP_201_CREATED)  
    
    @action(detail=True, methods=['post'], permission_classes=[Custom_IsAuthenticated])
    def unlike(self, request, pk=None):

        comment_instance = self.get_object()
        user_instance = request.user

        # Create relational data
        _, deleted = CommentLike.objects.filter(user=user_instance, comment=comment_instance).delete()
        if not deleted:
            return Response({'detail':'The comment already unliked by the user.'}, status=status.HTTP_304_NOT_MODIFIED)

        # Update likes_count of the comment
        comment_instance.likes_count = F('likes_count') - 1
        comment_instance.save(update_fields=['likes_count'])

        return Response({'detail':'The comment liked by the user.'}, status=status.HTTP_201_CREATED)  