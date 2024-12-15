
from .helpers import update_article_engagement_score, search_similar_embeddings, update_preference_vector
from .models import Article, Comment, ArticleLike, CommentLike, ArticleCourse, ArticleUser
from .permissions import Article_IsAuthenticated, Comment_IsAuthenticated
from django.db.models import OuterRef, Subquery, Exists, Case, When, F, Q
from .serializer import ArticleSerializer, CommentSerializer
from rest_framework.pagination import PageNumberPagination
from .constants import DELETED_BODY, DELETED_TITLE
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import viewsets, status
from account.models import User
from django.contrib.postgres.aggregates import ArrayAgg


class ArticleViewSet(viewsets.ModelViewSet):
    
    permission_classes = [Article_IsAuthenticated]
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

        # Set up pagination for articles
        paginator = PageNumberPagination()
        paginator.page_size = 10
        
        liked_articles = ArticleLike.objects.filter(
            user=user_instance,
            article=OuterRef('pk')
        )

        # Add user_temp_name & user_static_score to queryset
        queryset = self.get_queryset().annotate(
            user_temp_name=Subquery(
                ArticleUser.objects.filter(
                    article=OuterRef('pk'),
                    user=OuterRef('user')
                ).values('user_temp_name')[:1]
            ),
            user_static_points=Subquery(
                ArticleUser.objects.filter(
                    article=OuterRef('pk'),
                    user=OuterRef('user')
                ).values('user_static_points')[:1]
            ),
            user_school=Subquery(
                User.objects.filter(
                    id=OuterRef('user')
                ).values('school__initial')[:1]
            ),
            like_status=Exists(
                liked_articles
            )
        )

        # Apply pagination to the articles queryset
        paginated_articles = paginator.paginate_queryset(queryset, request)
        article_serializer = ArticleSerializer(paginated_articles, many=True)
        
        return paginator.get_paginated_response({
            'articles': article_serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def hot(self, request):
        user_instance = request.user

        # Set up pagination for articles
        paginator = PageNumberPagination()
        paginator.page_size = 10
        
        liked_articles = ArticleLike.objects.filter(
            user=user_instance,
            article=OuterRef('pk')
        )

        # Add user_temp_name & user_static_score to queryset
        queryset = self.get_queryset().annotate(
            user_temp_name=Subquery(
                ArticleUser.objects.filter(
                    article=OuterRef('pk'),
                    user=OuterRef('user')
                ).values('user_temp_name')[:1]
            ),
            user_static_points=Subquery(
                ArticleUser.objects.filter(
                    article=OuterRef('pk'),
                    user=OuterRef('user')
                ).values('user_static_points')[:1]
            ),
            user_school=Subquery(
                User.objects.filter(
                    id=OuterRef('user')
                ).values('school__initial')[:1]
            ),
            like_status=Exists(
                liked_articles
            )
        )

        # Apply pagination to the articles queryset
        sorted_articles = queryset.order_by('-engagement_score')
        paginated_articles = paginator.paginate_queryset(sorted_articles, request)
        article_serializer = ArticleSerializer(paginated_articles, many=True)
        
        return paginator.get_paginated_response({
            'articles': article_serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def preference(self, request):
        user_instance = request.user
        
        # Set up pagination for articles
        paginator = PageNumberPagination()
        paginator.page_size = 10
        
        liked_articles = ArticleLike.objects.filter(
            user=user_instance,
            article=OuterRef('pk')
        )

        # Add user_temp_name & user_static_score to queryset
        queryset = self.get_queryset().annotate(
            user_temp_name=Subquery(
                ArticleUser.objects.filter(
                    article=OuterRef('pk'),
                    user=OuterRef('user')
                ).values('user_temp_name')[:1]
            ),
            user_static_points=Subquery(
                ArticleUser.objects.filter(
                    article=OuterRef('pk'),
                    user=OuterRef('user')
                ).values('user_static_points')[:1]
            ),
            user_school=Subquery(
                User.objects.filter(
                    id=OuterRef('user')
                ).values('school__initial')[:1]
            ),
            like_status=Exists(
                liked_articles
            )
        )

        # Fetch Ids of the article based on the similarity
        ids = search_similar_embeddings(user_instance.embedding_vector, len(self.get_queryset()))
        
        # Fetch the article based on the fetched id while maintaining the order
        order = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(ids)])
        articles = queryset.filter(pk__in=ids).order_by(order)

        # Apply pagination to the articles queryset
        paginated_articles = paginator.paginate_queryset(articles, request)
        article_serializer = ArticleSerializer(paginated_articles, many=True)
        
        return paginator.get_paginated_response({
            'articles': article_serializer.data
        })

    def update(self, request, *args, **kwargs):
        return Response({'detail':'This action is not allowed.'}, status=status.HTTP_403_FORBIDDEN)

    def partial_update(self, request, *args, **kwargs):
        user_instance = request.user
        article_instance = self.get_object()

        # Block the modification for the deleted object
        if article_instance.deleted:
            return Response({'detail':'The article is deleted.'},status=status.HTTP_400_BAD_REQUEST)

        new_body = request.data.get('body', '').strip()

        if new_body:
            # Append new text to the existing body
            article_instance.body = new_body
            article_instance.edited = True
            article_instance.save(update_fields=['body', 'edited'])

        # Serialize the article and return the response
        article_instance.user_school = article_instance.user.school.initial
        articleUser_instance = ArticleUser.objects.get(
            article=article_instance,
            user=article_instance.user
        )

        article_instance.user_temp_name = articleUser_instance.user_temp_name
        article_instance.user_static_points = articleUser_instance.user_static_points

        course_codes = ArticleCourse.objects.filter(article=article_instance).values_list('course__code', flat=True)
        article_instance.course_code = list(course_codes)

        exist = ArticleLike.objects.filter(article=article_instance, user=user_instance).exists()
        article_instance.like_status = exist

        serializer = self.get_serializer(article_instance)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        user_instance = request.user
        article_instance = self.get_object()

        # Update views_count of the article
        article_instance.views_count = F('views_count') + 1
        article_instance.save(update_fields=['views_count'])

        # Update engagement score
        update_article_engagement_score(article_instance)

        # Fetch the updated instance
        article_instance = Article.objects.get(id=article_instance.id)

        article_instance.user_school = article_instance.user.school.initial
        articleUser_instance = ArticleUser.objects.get(
            article=article_instance,
            user=article_instance.user
        )

        article_instance.user_temp_name = articleUser_instance.user_temp_name
        article_instance.user_static_points = articleUser_instance.user_static_points

        course_codes = ArticleCourse.objects.filter(article=article_instance).values_list('course__code', flat=True)
        article_instance.course_code = list(course_codes)

        exist = ArticleLike.objects.filter(article=article_instance, user=user_instance).exists()
        article_instance.like_status = exist

        # Update user preference based on the embedding of article
        updated_preference_vector = update_preference_vector(user_instance.embedding_vector, article_instance.embedding_vector)
        user_instance.embedding_vector = updated_preference_vector
        user_instance.save(update_fields=['embedding_vector'])

        # Fetch the comments related to the article and parent_comment is null
        comment_queryset = Comment.objects.filter(
            article=article_instance, 
            parent_comment__isnull=True
        ).order_by('-created_at')

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
            user_school=F('user__school__initial'),
            user_temp_name=Subquery(user_info_subquery.values('user_temp_name')[:1]),
            user_static_points=Subquery(user_info_subquery.values('user_static_points')[:1]),
        )       

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
    
    def destroy(self, request, *args, **kwargs):
        article_instance = self.get_object()
        
        # Block the modification for the deleted object
        if article_instance.deleted:
            return Response({'detail':'The article is deleted.'},status=status.HTTP_400_BAD_REQUEST)

        # Remove and save original content
        article_instance.title = DELETED_TITLE
        article_instance.body = DELETED_BODY
        article_instance.deleted = True
        article_instance.save(update_fields=['title', 'body', 'deleted'])

        return Response({'detail':'The article is deleted.'},status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], permission_classes=[Article_IsAuthenticated])
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
    
    @action(detail=True, methods=['post'], permission_classes=[Article_IsAuthenticated])
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

    permission_classes = [Comment_IsAuthenticated]
    serializer_class = CommentSerializer

    def get_queryset(self):
        user = self.request.user 
        
        # Filter articles based on user's school or if the article is unicon
        queryset = Comment.objects.filter(
            Q(user__school=user.school) | Q(article__unicon=True)
        )
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        return Response({'detail':'This action is not allowed.'}, status=status.HTTP_403_FORBIDDEN)
    
    def update(self, request, *args, **kwargs):
        return Response({'detail':'This action is not allowed.'}, status=status.HTTP_403_FORBIDDEN)

    def partial_update(self, request, *args, **kwargs):
        comment_instance = self.get_object()

        # Block the modification for the deleted object
        if comment_instance.deleted:
            return Response({'detail':'The article is deleted.'},status=status.HTTP_400_BAD_REQUEST)
        
        new_body = request.data.get('body', '').strip()

        if new_body:

            # Append new text to the existing body
            comment_instance.body = new_body
            comment_instance.edited = True
            comment_instance.save(update_fields=['body', 'edited'])

        # Serialize the comment and return the response
        serializer = self.get_serializer(comment_instance)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        comment_instance = self.get_object()       

        # Block the modification for the deleted object
        if comment_instance.deleted:
            return Response({'detail':'The article is deleted.'},status=status.HTTP_400_BAD_REQUEST) 

        # Remove and save original content
        comment_instance.body = DELETED_BODY
        comment_instance.deleted = True
        comment_instance.save(update_fields=['body', 'deleted'])

        return Response({'detail':'The article is deleted.'},status=status.HTTP_204_NO_CONTENT)

    def retrieve(self, request, *args, **kwargs):
        user_instance = request.user
        comment_instance = self.get_object()

        comment_instance.user_school = comment_instance.user.school.initial
        articleUser_instance = ArticleUser.objects.get(
            article=comment_instance.article,
            user=comment_instance.user
        )

        comment_instance.user_temp_name = articleUser_instance.user_temp_name
        comment_instance.user_static_points = articleUser_instance.user_static_points

        exist = CommentLike.objects.filter(comment=comment_instance, user=user_instance).exists()
        comment_instance.like_status = exist

        # Fetch the nested comments related to the parent comment
        nested_comment_queryset = self.get_queryset().filter(
            parent_comment=comment_instance,
        ).order_by('-created_at')

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
            user_school=F('user__school__initial'),
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

    @action(detail=True, methods=['post'], permission_classes=[Comment_IsAuthenticated])
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
    
    @action(detail=True, methods=['post'], permission_classes=[Comment_IsAuthenticated])
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