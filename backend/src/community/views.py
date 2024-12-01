
from .models import Article, Comment, ArticleLike, CommentLike, ArticleCourse, ArticleUser
# from django.db.models import Case, When, BooleanField, Q
from rest_framework import viewsets
from .serializer import ArticleSerializer, CommentSerializer
from .permissions import Custom_IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.db.models import OuterRef, Subquery, Exists
from django.db.models import F, Q, FloatField
from django.db.models.functions import Log
from .constants import update_article_engagement_score
# from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
# from django.core.cache import cache
# from django.utils import timezone
# from .forums import outback_algorithm, front_yard_algorithm, campus_algorithm, back_yard_algorithm, home_algorithm

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
        beginning_datetime = request.session.get('beginning_datetime', False)
        articles_number = request.session.get('articles_number', False)



        # Fetch most recent articles
        recent_articles_queryset = self.queryset.filter(created_at__lte=beginning_datetime)[:articles_number]

        # Preference, Created at, Points
        # recent_articles_queryset = recent_articles_queryset.annotate(
        #     views_score=Log(F('views_count') + 1, output_field=FloatField()),
        #     likes_score=Log(F('likes_count') + 1, output_field=FloatField()),
        #     comments_score=Log(F('comments_count') + 1, output_field=FloatField())
        # ).annotate(
        #     engagement_score=F('views_score') * 0.1 + F('likes_score') * 0.2 + F('comments_score') * 0.3
        # )

        # Paginate
        
        return Response({'detail':'This action is not allowed.'}, status=status.HTTP_403_FORBIDDEN)

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
            parent_comment.comments_count = F('comments_count') + 1  
            parent_comment.save(update_fields=['comments_count'])

        # Update the comments_count of article
        article_instance.comments_count = F('comments_count') + 1  
        article_instance.save(update_fields=['comments_count'])
        
        # Update engagement score
        update_article_engagement_score(article_instance)

        # Delete the comment
        comment_instance.delete()

        return Response({'detail':'The article is deleted.'},status=status.HTTP_204_NO_CONTENT)

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
        comment_instance.likes_count + F('likes_count') + 1
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
    
    

# class OldArticleViewSet(viewsets.ModelViewSet):
#     permission_classes = [Custom_IsAuthenticated]
#     serializer_class = ArticleSerializer

#     def get_queryset(self):
#         user_instance = self.request.user
#         if self.action in ['outback']:
#             return Article.objects.Base().filter(forum__name='outback')
#         elif self.action in ['front_yard', 'back_yard', 'campus']:
#             forum_name = self.action.replace('_',' ')
#             return Article.objects.Base().filter(forum__name=forum_name ,user__school__id=user_instance.school.id)
#         elif self.action == 'home':
#             return Article.objects.Base().filter(Q(forum__name='outback') | (~Q(forum__name='outback') & Q(user__school__id=user_instance.school.id)))
#         else:
#             return Article.objects.filter(Q(forum__name='outback') | (~Q(forum__name='outback') & Q(user__school__id=user_instance.school.id)))

#     def list(self, request, *args, **kwargs):
#         return Response({'detail':'This action is not allowed.'}, status=status.HTTP_403_FORBIDDEN)

#     def update(self, request, *args, **kwargs):
#         return Response({'detail':'This action is not allowed.'}, status=status.HTTP_403_FORBIDDEN)

#     def perform_create(self, serializer):
#         course_code = serializer.validated_data.get('course_code')
#         forum_name = serializer.validated_data.get('forum_name')
#         forum_instance = Forum.objects.get(name=forum_name)
#         user_instance = self.request.user

#         # Save article to model
#         article = serializer.save(user=self.request.user)
        
#         if course_code:
            
#             #create course_code forum if no forum has been found in user course forum
#             course, _ = Course.objects.get_or_create(code=course_code.lower(), school=user_instance.school)

#             #assign article to course_code forum
#             ArticleCourse.objects.create(article=article, course=course)

#         # Delete cache
#         remove_cache(self, forum_instance=forum_instance)

#     def retrieve(self, request, *args, **kwargs):
#         user_instance = request.user
#         article_instance = self.get_object()

#         # Cache or fetch article attributes (non user specific)
#         article_instance.author_id = get_or_set_cache(
#             ARTICLE_AUTHOR_ID_KEY(article_instance.id),
#             lambda: article_instance.user.id
#         )
#         article_instance.author_username = get_or_set_cache(
#             ARTICLE_AUTHOR_USERNAME_KEY(article_instance.id),
#             lambda: article_instance.user.username
#         )
#         article_instance.author_school = get_or_set_cache(
#             ARTICLE_AUTHOR_SCHOOL_KEY(article_instance.id),
#             lambda: article_instance.user.school.initial
#         )
#         article_instance.likes_count = get_or_set_cache(
#             ARTICLE_LIKES_COUNT_KEY(article_instance.id),
#             lambda: ArticleLike.objects.filter(article=article_instance).count()
#         )
#         article_instance.views_count = ArticleView.objects.filter(article=article_instance).count()

#         # Cache or fetch article attributes (user specific)
#         article_instance.like_status = get_or_set_cache(
#             ARTICLE_LIKE_STATUS_KEY(article_instance.id, user_instance.id),
#             lambda: ArticleLike.objects.filter(article=article_instance, user=user_instance).exists()
#         )
        
#         # Cache or fetch comments attributes (non user specific)
#         comment_queryset = get_or_set_cache(
#             TOP_COMMENT_QUERYSET_KEY(article_instance.id),
#             lambda: Comment.objects.Base().filter(article=article_instance, parent_comment__isnull=True).order_by('created_at')
#         )
        
#         # Cache or fetch comments attributes (user specific)
#         liked_comment_ids = get_or_set_cache(
#             LIKED_TOP_COMMENT_IDS_KEY(article_instance.id, user_instance.id),
#             lambda: list(CommentLike.objects.filter(comment__article=article_instance, comment__parent_comment__isnull=True, user=user_instance).values_list('id', flat=True))
#         )
        
#         comment_queryset = comment_queryset.annotate(
#             like_status=Case(
#                 When(id__in=liked_comment_ids, then=True),
#                 default=False,
#                 output_field=BooleanField()
#             )
#         )
        
#         # Create ArticleView relational data
#         ArticleView.objects.update_or_create(article=article_instance, user=user_instance, defaults={'viewed_at': timezone.now()})
        
#         # Update the article popularity
#         article_instance.popularity += ARTICLE_POPULARITY_SCORES['retrieved']
#         article_instance.save(update_fields=['popularity'])

#         # Set up pagination for comments
#         paginator = PageNumberPagination()
#         paginator.page_size = PAGINATION_SIZE['article']

#         # Apply pagination to the comments queryset
#         paginated_comments = paginator.paginate_queryset(comment_queryset, request)
#         comment_serializer = CommentSerializer(paginated_comments, many=True)

#         # Construct response using paginated response
#         article_data = ArticleSerializer(article_instance).data
#         return paginator.get_paginated_response({
#             'article': article_data,
#             'comments': comment_serializer.data
#         })

#     def partial_update(self, request, *args, **kwargs):
#         article_instance = self.get_object()
#         new_text = request.data.get('body', '')

#         # Append new text to the existing body
#         article_instance.body += article_instance.body + APPENDING_BAR + new_text
#         article_instance.save(update_fields=['body'])

#         # Update last_edited_at of the article
#         article_instance.last_edited_at = timezone.now()
#         article_instance.save(update_fields=['last_edited_at'])

#         # Delete cache
#         remove_cache(self, article_instance=article_instance)

#         # Serialize the article and return the response
#         serializer = self.get_serializer(article_instance)
#         return Response(serializer.data)

#     def destroy(self, request, *args, **kwargs):
#         article_instance = self.get_object()

#         # Delete cache
#         cache.delete(ARTICLE_QUERYSET_KEY(article_instance.forum.id))

#         # Remove and save original content
#         article_instance.body = DELETED_ARTICLE
#         article_instance.deleted = True
#         article_instance.save(update_fields=['body', 'deleted'])

#         return Response({'detail':'The article is deleted.'},status=status.HTTP_204_NO_CONTENT)

#     @action(detail=True, methods=['post'], permission_classes=[Custom_IsAuthenticated])
#     def like(self, request, pk=None):
#         article_instance = self.get_object()
#         user_instance = request.user


#         # Create relational data
#         _, created = ArticleLike.objects.get_or_create(user=user_instance, article=article_instance)
#         if not created:
#             return Response({'detail':'The article already liked by the user.'}, status=status.HTTP_304_NOT_MODIFIED)
            
#         # Update article popularity
#         article_instance.popularity += ARTICLE_POPULARITY_SCORES['article_liked']
#         article_instance.save(update_fields=['popularity'])

#         # Delete article like status and likes count cache
#         remove_cache(self, user_instance=user_instance, article_instance=article_instance)

#         return Response({'detail':'The article liked by the user.'}, status=status.HTTP_201_CREATED)    
        
#     @action(detail=True, methods=['post'], permission_classes=[Custom_IsAuthenticated])
#     def unlike(self, request, pk=None):
#         article_instance = self.get_object()
#         user_instance = request.user

#         # Validate the relational data is exist
#         deleted = ArticleLike.objects.filter(user=user_instance, article=article_instance).delete()
        
#         if deleted[0] == 0:
#             return Response({'detail':'The article already unliked by the user.'}, status=status.HTTP_304_NOT_MODIFIED)
            
#         # Delete article like status and likes count cache    
#         remove_cache(self, user_instance=user_instance, article_instance=article_instance)

#         return Response({'detail':'The article unliked by the user.'}, status=status.HTTP_204_NO_CONTENT) 
              
#     @action(detail=False, methods=['get'], permission_classes=[Custom_IsAuthenticated])
#     def outback(self, request):
#         return outback_algorithm(self, request)
    
#     @action(detail=False, methods=['get'], permission_classes=[Custom_IsAuthenticated], url_path='front_yard')
#     def front_yard(self, request):
#         return front_yard_algorithm(self, request)
    
#     @action(detail=False, methods=['get'], permission_classes=[Custom_IsAuthenticated])
#     def campus(self, request):
#         return campus_algorithm(self, request)
    
#     @action(detail=False, methods=['get'], permission_classes=[Custom_IsAuthenticated], url_path='back_yard')
#     def back_yard(self, request):
#         return back_yard_algorithm(self, request)
    
#     @action(detail=False, methods=['get'], permission_classes=[Custom_IsAuthenticated])
#     def home(self, request):
#         return home_algorithm(self, request)
    
# class UserCourseViewSet(viewsets.ModelViewSet):
#     permission_classes = [Custom_IsAuthenticated]
#     serializer_class = UserCourseSerializer
#     queryset = UserCourse.objects.all()  
        
#     def update(self, request, *args, **kwargs):
#         return Response({'detail':'This action is not allowed.'}, status=status.HTTP_403_FORBIDDEN)
    
#     def partial_update(self, request, *args, **kwargs):
#         return Response({'detail':'This action is not allowed.'}, status=status.HTTP_403_FORBIDDEN)
    
#     def list(self, request, *args, **kwargs):
#         return Response({'detail':'This action is not allowed.'}, status=status.HTTP_403_FORBIDDEN)
    
#     def retrieve(self, request, *args, **kwargs):
#         return Response({'detail':'This action is not allowed.'}, status=status.HTTP_403_FORBIDDEN)

# class CommentViewSet(viewsets.ModelViewSet):
#     permission_classes = [Custom_IsAuthenticated]
#     serializer_class = CommentSerializer
#     queryset = Comment.objects.all()
    
#     def list(self, request, *args, **kwargs):
#         return Response({'detail':'This action is not allowed.'}, status=status.HTTP_403_FORBIDDEN)
    
#     def perform_create(self, serializer):
#         article_id = serializer.validated_data.get('article_id')
#         article_instance = get_object_or_404(Article, pk=article_id)
        
#         # Update the article last_edited_at property
#         article_instance.last_commented_at = timezone.now()
#         article_instance.save(update_fields=['last_commented_at'])

#         # Update popularity score
#         article_instance.popularity += ARTICLE_POPULARITY_SCORES['commented']
#         article_instance.save(update_fields=['popularity'])

#         serializer.save(user=self.request.user)

#         # Delete cache of nested comments or top comments
#         parent_comment_id = serializer.validated_data.get('parent_comment_id', False)
#         remove_cache(self, article_instance=article_instance, parent_comment_id=parent_comment_id)
    
#     def retrieve(self, request, *args, **kwargs):
#         user_instance = request.user
#         parent_comment_instance = self.get_object()

#         # Validate the comment has one ore more nested comment
#         if parent_comment_instance.parent_comment is not None:
#             return Response({'detail':'The comment is not a top level comment.'}, status=status.HTTP_404_NOT_FOUND)

#         # Cache or fetch comments attributes (none user specific, static)
#         nested_comment_queryset = get_or_set_cache(
#             NESTED_COMMENT_QUERYSET_KEY(parent_comment_instance.id),
#             lambda: Comment.objects.Base().filter(article=parent_comment_instance.article, parent_comment=parent_comment_instance).order_by('created_at')
#         )
        
#         # Cache or fetch comments attributes (user specific, static)
#         liked_nested_comment_ids = get_or_set_cache(
#             LIKED_NESTED_COMMENT_IDS_KEY(parent_comment_instance.id, user_instance.id),
#             lambda: list(CommentLike.objects.filter(comment__parent_comment=parent_comment_instance, user=user_instance).values_list('id', flat=True))
#         )
        
#         nested_comment_queryset = nested_comment_queryset.annotate(
#             like_status=Case(
#                 When(id__in=liked_nested_comment_ids, then=True),
#                 default=False,
#                 output_field=BooleanField()
#             )
#         )

#         # Set up pagination for comments
#         paginator = PageNumberPagination()
#         paginator.page_size = PAGINATION_SIZE['nested_comment']

#         # Apply pagination to the comments queryset
#         paginated_comments = paginator.paginate_queryset(nested_comment_queryset, request)
#         comment_serializer = CommentSerializer(paginated_comments, many=True)

#         # Construct response
#         return paginator.get_paginated_response({
#             'comments': comment_serializer.data
#         })  
    
#     def update(self, request, *args, **kwargs):
#         return Response({'detail':'This action is not allowed.'}, status=status.HTTP_403_FORBIDDEN)
    
#     def partial_update(self, request, *args, **kwargs):
#         comment_instance = self.get_object()
#         new_text = request.data.get('body', '')

#         # Update the comment body and save it to DB
#         comment_instance.body = comment_instance.body + APPENDING_BAR + new_text
#         comment_instance.save(update_fields=['body'])

#         # Remove the cache to update the change
#         remove_cache(self, comment_instance=comment_instance)
        
#         # Serialize and return the response
#         serializer = self.get_serializer(comment_instance)
#         return Response(serializer.data)
      
#     def destroy(self, request, *args, **kwargs):
#         comment_instance = self.get_object()

#         # Update the article and save it to DB
#         comment_instance.body = DELETED_COMMENT
#         comment_instance.deleted = True
#         comment_instance.save(update_fields=['body', 'deleted'])

#         # Remove the cache to update the change
#         remove_cache(self, comment_instance=comment_instance)

#         return Response({'detail':'The article is deleted.'},status=status.HTTP_204_NO_CONTENT)

#     @action(detail=True, methods=['post'], permission_classes=[Custom_IsAuthenticated])
#     def like(self, request, pk=None):
#         comment_instance = self.get_object()
#         user_instance = request.user
        
#         # Create Like relational data
#         _, created = CommentLike.objects.get_or_create(user=user_instance, comment=comment_instance)
#         if not created:
#             return Response({'detail':'The comment already liked by the user.'}, status=status.HTTP_304_NOT_MODIFIED)
            
#          # Update comment popularity
#         comment_instance.article.popularity += ARTICLE_POPULARITY_SCORES['comment_liked']
#         comment_instance.article.save(update_fields=['popularity'])

#         # Delete cache of nested comments or top comments
#         remove_cache(self, user_instance=user_instance, comment_instance=comment_instance)

#         return Response({'detail':'The comment liked by the user.'}, status=status.HTTP_201_CREATED)

#     @action(detail=True, methods=['post'], permission_classes=[Custom_IsAuthenticated])
#     def unlike(self, request, pk=None):
#         comment_instance = self.get_object()
#         user_instance = request.user
        
#         # Remove like relation in the table
#         deleted = CommentLike.objects.filter(user=user_instance, comment=comment_instance).delete()          
#         if deleted[0] == 0:
#             return Response({'detail':'The comment already unliked by the user.'}, status=status.HTTP_304_NOT_MODIFIED)
                
#         # Delete cache of nested comments or top comments
#         remove_cache(self, user_instance=user_instance, comment_instance=comment_instance)

#         return Response({'detail':'The comment unliked by the user.'}, status=status.HTTP_204_NO_CONTENT)

            
        
            
    

