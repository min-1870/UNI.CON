from account.models import User, School
from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=100, default="unknown", null=False)
    body = models.TextField(default="unknown", null=False)

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    unicon = models.BooleanField(default=True, null=False)
    deleted = models.BooleanField(default=False, null=False)
    edited = models.BooleanField(default=False, null=False)

    created_at = models.DateTimeField(null=False, auto_now_add=True)
    views_count = models.IntegerField(default=0, null=False)
    comments_count = models.IntegerField(default=0, null=False)
    likes_count = models.IntegerField(default=0, null=False)

    embedding_vector = models.JSONField(null=False, blank=True)
    engagement_score = models.FloatField(default=0, null=False)

    class Meta:
        ordering = ['-created_at'] 

class ArticleUser(models.Model):
    user_temp_name = models.CharField(max_length=100, default="unknown", null=False)
    user_static_points = models.BigIntegerField(default=100, null=False)
    article = models.ForeignKey(Article, on_delete=models.CASCADE, null=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)

    class Meta:
        unique_together = ('user', 'article')

class ArticleLike(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, null=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    
class Course(models.Model):
    code = models.CharField(max_length=100, default="unknown", null=False)
    school = models.ForeignKey(School, on_delete=models.CASCADE, null=False)

class ArticleCourse(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, null=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=False)
    
    
class Comment(models.Model): 
    body = models.TextField(default="unknown", null=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)

    deleted = models.BooleanField(default=False, null=False)
    
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True)
    article = models.ForeignKey(Article, on_delete=models.CASCADE, null=False)

    created_at = models.DateTimeField(null=False, auto_now_add=True)
    comments_count = models.IntegerField(default=0, null=False)
    likes_count = models.IntegerField(default=0, null=False)

    class Meta:
        ordering = ['-created_at'] 

class CommentLike(models.Model):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, null=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
