
# from .models import Forum, Course
# from django.db.models import OuterRef, F, Case, When, FloatField, Subquery, Func, Q, IntegerField, Value
# from django.db.models.functions import Coalesce
# from .constants import (    
#     VIEWED_ARTICLE_SCORE_PENALTY_RATE,
#     ARTICLE_QUERYSET_KEY,
#     SUBSCRIBED_COURSE_IDS_KEY,
#     get_or_set_cache,
#     get_forum_view,
#     apply_pagination,
#     apply_like_status_view_time
# )

# def outback_algorithm(view, request):
#     queryset = view.get_queryset()
#     user_instance = view.request.user
#     forum_instance = Forum.objects.get(name='outback')
#     forum_view_instance = get_forum_view(view, forum_instance)
    
#     # Cache or fetch articles with base attributes
#     article_queryset = apply_like_status_view_time(user_instance, forum_instance, get_or_set_cache(
#         ARTICLE_QUERYSET_KEY(forum_instance.id),
#         lambda: queryset
#     ))
    
#     # Fetch user specific attributes
#     article_queryset = article_queryset.annotate(
#         score=Case(
#             When(
#                 Q(view_time__isnull=False) & (
#                     Q(view_time__gt=Coalesce(F('last_commented_at'), F('created_at'))) |
#                     Q(view_time__gt=Coalesce(F('last_edited_at'), F('created_at')))
#                 ),
#                 then=Func(F('popularity'), forum_view_instance.gravity, function='POWER', output_field=FloatField()) * VIEWED_ARTICLE_SCORE_PENALTY_RATE
#             ),
#             default=Func(F('popularity'), forum_view_instance.gravity, function='POWER', output_field=FloatField()),
#             output_field=FloatField()
#         )
#     ).order_by('-score')
        
#     return apply_pagination(article_queryset, request)

# def front_yard_algorithm(view, request):
#     queryset = view.get_queryset()
#     user_instance = view.request.user
#     forum_instance = Forum.objects.get(name='front yard')
#     forum_view_instance = get_forum_view(view, forum_instance)
    
#     # Cache or fetch articles with base attributes
#     article_queryset = apply_like_status_view_time(user_instance, forum_instance, get_or_set_cache(
#         ARTICLE_QUERYSET_KEY(forum_instance.id, user_instance.school.id),
#         lambda: queryset
#     ))

#     # Fetch user specific attributes
#     article_queryset = article_queryset.annotate(
#         score=Case(
#             When(
#                 Q(view_time__isnull=False) & (
#                     Q(view_time__gt=Coalesce(F('last_commented_at'), F('created_at'))) |
#                     Q(view_time__gt=Coalesce(F('last_edited_at'), F('created_at')))
#                 ),
#                 then=Func(F('popularity'), forum_view_instance.gravity, function='POWER', output_field=FloatField()) * VIEWED_ARTICLE_SCORE_PENALTY_RATE
#             ),
#             default=Func(F('popularity'), forum_view_instance.gravity, function='POWER', output_field=FloatField()),
#             output_field=FloatField()
#         )
#     ).order_by('-score')
        
#     return apply_pagination(article_queryset, request)

# def campus_algorithm(view, request):
#     queryset = view.get_queryset()
#     user_instance = view.request.user
#     forum_instance = Forum.objects.get(name='campus')
#     forum_view_instance = get_forum_view(view, forum_instance)
    
#     # Cache or fetch articles with base attributes
#     article_queryset = apply_like_status_view_time(user_instance, forum_instance, get_or_set_cache(
#         ARTICLE_QUERYSET_KEY(forum_instance.id, user_instance.school.id),
#         lambda: queryset.annotate(
#             course_code=Subquery(Course.objects.filter(articlecourse__article=OuterRef('id')).values('code')[:1]),
#             course_id=Subquery(Course.objects.filter(articlecourse__article=OuterRef('id')).values('id')[:1]),
#         )
#     ))

#     # Fetch user specific attributes
#     subscribed_course_ids = get_or_set_cache(
#         SUBSCRIBED_COURSE_IDS_KEY(user_instance.id),
#         lambda: list(Course.objects.filter(usercourse__user=user_instance).values_list('id', flat=True))
#     )

#     article_queryset = article_queryset.annotate(
#         subscribed=Case(When(course_id__in=subscribed_course_ids, then=Value(1)), default=Value(0), output_field=IntegerField()),
#         score=Case(
#             When(
#                 Q(view_time__isnull=False) & (
#                     Q(view_time__gt=Coalesce(F('last_commented_at'), F('created_at'))) |
#                     Q(view_time__gt=Coalesce(F('last_edited_at'), F('created_at')))
#                 ),
#                 then=Func(F('popularity'), forum_view_instance.gravity, function='POWER', output_field=FloatField()) * VIEWED_ARTICLE_SCORE_PENALTY_RATE
#             ),
#             default=Func(F('popularity'), forum_view_instance.gravity, function='POWER', output_field=FloatField()),
#             output_field=FloatField()
#         )
#     ).order_by('-subscribed', '-score')
        
#     return apply_pagination(article_queryset, request)

# def back_yard_algorithm(view, request):
#     queryset = view.get_queryset()
#     user_instance = view.request.user
#     forum_instance = Forum.objects.get(name='back yard')
#     forum_view_instance = get_forum_view(view, forum_instance)
    
#     # Cache or fetch articles with base attributes
#     article_queryset = apply_like_status_view_time(user_instance, forum_instance, get_or_set_cache(
#         ARTICLE_QUERYSET_KEY(forum_instance.id, user_instance.school.id),
#         lambda: queryset
#     ))

#     # Fetch user specific attributes
#     article_queryset = article_queryset.annotate(
#         score=Case(
#             When(
#                 Q(view_time__isnull=False) & (
#                     Q(view_time__gt=Coalesce(F('last_commented_at'), F('created_at'))) |
#                     Q(view_time__gt=Coalesce(F('last_edited_at'), F('created_at')))
#                 ),
#                 then=Func(F('popularity'), forum_view_instance.gravity, function='POWER', output_field=FloatField()) * VIEWED_ARTICLE_SCORE_PENALTY_RATE
#             ),
#             default=Func(F('popularity'), forum_view_instance.gravity, function='POWER', output_field=FloatField()),
#             output_field=FloatField()
#         )
#     ).order_by('-score')
        
#     return apply_pagination(article_queryset, request)

# def home_algorithm(view, request):
#     queryset = view.get_queryset()
#     user_instance = view.request.user
#     forum_instance = Forum.objects.get(name='home')
#     forum_view_instance = get_forum_view(view, forum_instance)
    
#     # Cache or fetch articles with base attributes
#     article_queryset = apply_like_status_view_time(user_instance, forum_instance, get_or_set_cache(
#         ARTICLE_QUERYSET_KEY(forum_instance.id, user_instance.school.id),
#         lambda: queryset.annotate(
#             course_code=Subquery(Course.objects.filter(articlecourse__article=OuterRef('id')).values('code')[:1]),
#             course_id=Subquery(Course.objects.filter(articlecourse__article=OuterRef('id')).values('id')[:1]),
#             forum_name=F('forum__name')
#         )
#     ))

#     # Fetch user specific attributes
#     article_queryset = article_queryset.annotate(
#         score=Case(
#             When(
#                 Q(view_time__isnull=False) & (
#                     Q(view_time__gt=Coalesce(F('last_commented_at'), F('created_at'))) |
#                     Q(view_time__gt=Coalesce(F('last_edited_at'), F('created_at')))
#                 ),
#                 then=Func(F('popularity'), forum_view_instance.gravity, function='POWER', output_field=FloatField()) * VIEWED_ARTICLE_SCORE_PENALTY_RATE
#             ),
#             default=Func(F('popularity'), forum_view_instance.gravity, function='POWER', output_field=FloatField()),
#             output_field=FloatField()
#         )
#     ).order_by('-score')
        
#     return apply_pagination(article_queryset, request)
