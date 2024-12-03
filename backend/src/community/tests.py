from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from .models import User  
from copy import deepcopy
from .models import Article, Course, ArticleCourse, School, ArticleLike, Comment, CommentLike
#, Forum, Course, ArticleCourse, ArticleLike, UserCourse, Comment, CommentLike
from .constants import update_preference_vector
import json
from datetime import datetime

import numpy as np



class ArticleCreateTest(APITestCase):
    fixtures = ['fixtures.json']

    def setUp(self):
        self.client = APIClient()
        
        self.RegisterSubmitView_url = reverse('register/submit') 
        self.RegisterConfirmView_url = reverse('register/confirm')

        self.ArticlePatchDetailDelete_name = 'article-detail'
        self.ArticleListCreate_name = 'article-list'
        self.ArticleScore_name = 'article-hot'
        self.ArticlePreference_name = 'article-preference'
        self.ArticleLike_name = 'article-like'
        self.ArticleUnlike_name = 'article-unlike'

        self.CommentPatchDetailDelete_name = 'comment-detail'
        self.CommentListCreate_name = 'comment-list'
        self.CommentLike_name = 'comment-like'
        self.CommentUnlike_name = 'comment-unlike'

        self.mock_article ={
            "title":"Nice title",
            "body":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            "unicon":True,
        }

        self.mock_comment ={
            "body":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        }
        
        self.mock_user1 = {
            "password": "securepassword123",
            "email": "z5555555@student.unsw.edu.au"
        } 
        
        self.mock_user2 = {
            "password": "securepassword123",
            "email": "z6666666@student.unsw.edu.au"
        } 
        
        self.mock_user3 = {
            "password": "securepassword123",
            "email": "z7777777@student.unsw.edu.au"
        } 

        self.mock_comment = {"body":"Lorem ipsum dolor sit amet."}
    
    def register_account(self, user_data, instance=True):
        #Register a new account
        response = self.client.post(self.RegisterSubmitView_url, user_data, format='json')
        self.assertIs(response.status_code, status.HTTP_201_CREATED, f"Wrong response status: {response.data}")

        #Apply token
        access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        #Fetch validation code
        user_instance = User.objects.get(email=user_data['email'])
        validation_data = {'validation_code': user_instance.validation_code}
        response = self.client.post(self.RegisterConfirmView_url, validation_data, format='json')

        if instance:
            return User.objects.get(email=user_data['email'])
        else:        
            return response
     
    def test_post_article(self):

        user_instance = self.register_account(self.mock_user1)

        # Post an article
        url = reverse(self.ArticleListCreate_name)
        response = self.client.post(url, self.mock_article, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Validate existence of the article
        article_exist = Article.objects.filter(id=response.data['id']).exists()
        self.assertTrue(article_exist)
        article_instance = Article.objects.get(pk=response.data['id'])

        # Validate attributes
        self.assertEqual(user_instance, article_instance.user)
        self.assertEqual(self.mock_article['title'], article_instance.title)
        self.assertEqual(self.mock_article['body'], article_instance.body)
        self.assertEqual(self.mock_article['unicon'], article_instance.unicon)

    def test_post_article_with_course(self):

        user_instance = self.register_account(self.mock_user1)

        mock_article = deepcopy(self.mock_article)
        mock_article['course_code'] = 'comp1231, Comp1320'        
        mock_article['unicon'] = False

        # Post an article with courses
        url = reverse(self.ArticleListCreate_name)
        response = self.client.post(url, mock_article, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Validate Article
        article_exist = Article.objects.filter(id=response.data['id']).exists()
        self.assertTrue(article_exist)
        article_instance = Article.objects.get(pk=response.data['id'])

        # Validate attributes
        self.assertEqual(user_instance, article_instance.user)
        self.assertEqual(mock_article['title'], article_instance.title)
        self.assertEqual(mock_article['body'], article_instance.body)
        self.assertEqual(mock_article['unicon'], article_instance.unicon)

        #Validate Course
        for code in mock_article['course_code'].split(','):

            code = code.upper().strip()

            course_exist = Course.objects.filter(code=code, school=user_instance.school).exists()
            self.assertTrue(course_exist)
            course_instance = Course.objects.get(code=code, school=user_instance.school)

            # Validate attributes
            self.assertEqual(code, course_instance.code)
            self.assertEqual(user_instance.school, course_instance.school)

            #Validate ArticleCourse
            articleCourse_exist = ArticleCourse.objects.filter(article=article_instance, course=course_instance).exists()
            self.assertTrue(articleCourse_exist)

    def test_patch_article(self):

        _ = self.register_account(self.mock_user1)

        # Post an article
        url = reverse(self.ArticleListCreate_name)
        response = self.client.post(url, self.mock_article, format='json')

        # Patch the article
        appended_body = {'body':'12345'}
        url = reverse(self.ArticlePatchDetailDelete_name, kwargs={'pk': response.data['id']})
        response = self.client.patch(url, appended_body, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Validate the appended content
        article_instance = Article.objects.get(pk=response.data['id'])
        self.assertEqual(article_instance.body, appended_body['body'])

    def test_delete_article(self):

        _ = self.register_account(self.mock_user1)

        # Post a article
        url = reverse(self.ArticleListCreate_name)
        post_response = self.client.post(url, self.mock_article, format='json')

        # Delete the article
        url = reverse(self.ArticlePatchDetailDelete_name, kwargs={'pk':post_response.data['id']})
        delete_response = self.client.delete(url, format='json')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Validate the article has been deleted
        article_instance = Article.objects.get(pk=post_response.data['id'])
        self.assertTrue(article_instance.deleted)
     
    def article(self, restful, data, instance=True, kwargs=0):

        if restful == 'post':
            url = reverse(self.ArticleListCreate_name)
            response = self.client.post(url, data, format='json')

        elif restful == 'patch':
            url = reverse(self.ArticlePatchDetailDelete_name, kwargs=kwargs)
            response = self.client.patch(url, data, format='json')

        elif restful == 'delete':
            url = reverse(self.ArticlePatchDetailDelete_name, kwargs=kwargs)
            response = self.client.delete(url, data, format='json')

        if instance:
            return Article.objects.get(pk=response.data['id'])
        else:
            return response
     
    def test_like_article(self):

        user_instance = self.register_account(self.mock_user1)
        article_instance = self.article('post', self.mock_article)

        # Like an article
        like_article_url = reverse(self.ArticleLike_name, kwargs={'pk': article_instance.id}) 
        like_article_response = self.client.post(like_article_url)
        self.assertEqual(like_article_response.status_code, status.HTTP_200_OK)
        

        # Validate the relational data
        article_like_exist = ArticleLike.objects.filter(article=article_instance, user=user_instance).exists()
        self.assertTrue(article_like_exist)
        article_instance = Article.objects.get(pk=article_instance.id)
        self.assertEqual(article_instance.likes_count, 1)

    def test_unlike_article(self):

        user_instance = self.register_account(self.mock_user1)
        article_instance = self.article('post', self.mock_article)

        # Like an article
        like_article_url = reverse(self.ArticleLike_name, kwargs={'pk': article_instance.id}) 
        self.client.post(like_article_url)

        # Unlike an article
        unlike_article_url = reverse(self.ArticleUnlike_name, kwargs={'pk': article_instance.id}) 
        unlike_article_response = self.client.post(unlike_article_url)
        self.assertEqual(unlike_article_response.status_code, status.HTTP_200_OK)

        # Validate the relational data
        article_like_exist = ArticleLike.objects.filter(article=article_instance, user=user_instance).exists()
        self.assertFalse(article_like_exist)
        self.assertEqual(article_instance.likes_count, 0)

    def test_post_comment(self):

        user_instance = self.register_account(self.mock_user1)
        article_instance = self.article('post', self.mock_article)
        comment_data = deepcopy(self.mock_comment)
        comment_data['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(self.CommentListCreate_name)
        post_comment_response = self.client.post(post_comment_url, comment_data, format='json')
        self.assertEqual(post_comment_response.status_code, status.HTTP_201_CREATED)
        
        # Validate the database
        exist = Comment.objects.filter(id=post_comment_response.data['id']).exists
        self.assertTrue(exist)
        comment_instance = Comment.objects.get(pk=post_comment_response.data['id'])
        self.assertEqual(comment_instance.user, user_instance)
        self.assertEqual(comment_instance.body, comment_data['body'])
        article_instance = Article.objects.get(pk=article_instance.id)
        self.assertEqual(article_instance.comments_count, 1)

    def test_post_nested_comment(self):

        user_instance = self.register_account(self.mock_user1)
        article_instance = self.article('post', self.mock_article)
        comment_data = deepcopy(self.mock_comment)
        comment_data['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(self.CommentListCreate_name)
        post_comment_response = self.client.post(post_comment_url, comment_data, format='json')
        
        # Post a nested comment
        comment_data['parent_comment'] = post_comment_response.data['id']
        post_nested_comment_url = reverse(self.CommentListCreate_name)
        post_nested_comment_response = self.client.post(post_nested_comment_url, comment_data, format='json')
        self.assertEqual(post_nested_comment_response.status_code, status.HTTP_201_CREATED)
        
        # Validate the database
        exist = Comment.objects.filter(id=post_nested_comment_response.data['id']).exists
        self.assertTrue(exist)
        comment_instance = Comment.objects.get(pk=post_nested_comment_response.data['id'])
        self.assertEqual(comment_instance.user, user_instance)
        self.assertEqual(comment_instance.body, comment_data['body'])
        parent_comment_instance = Comment.objects.get(pk=post_comment_response.data['id'])
        self.assertEqual(parent_comment_instance.comments_count, 1)
        article_instance = Article.objects.get(pk=article_instance.id)
        self.assertEqual(article_instance.comments_count, 2)

    def test_patch_comment(self):

        user_instance = self.register_account(self.mock_user1)
        article_instance = self.article('post', self.mock_article)
        comment_data = deepcopy(self.mock_comment)
        comment_data['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(self.CommentListCreate_name)
        post_comment_response = self.client.post(post_comment_url, comment_data, format='json')
        
        # Patch the comment
        comment_data = {'body':'12345'}
        patch_comment_url = reverse(self.CommentPatchDetailDelete_name, kwargs={'pk':post_comment_response.data['id']})
        patch_comment_response = self.client.patch(patch_comment_url, comment_data, format='json')
        self.assertEqual(patch_comment_response.status_code, status.HTTP_200_OK)
        
        # Validate the database
        comment_instance = Comment.objects.get(pk=patch_comment_response.data['id'])
        self.assertEqual(comment_instance.user, user_instance)
        self.assertEqual(comment_instance.body, comment_data['body'])

    def test_delete_comment(self):

        _ = self.register_account(self.mock_user1)
        article_instance = self.article('post', self.mock_article)
        comment_data = deepcopy(self.mock_comment)
        comment_data['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(self.CommentListCreate_name)
        post_comment_response = self.client.post(post_comment_url, comment_data, format='json')

        # Delete the comment
        url = reverse(self.CommentPatchDetailDelete_name, kwargs={'pk':post_comment_response.data['id']})
        delete_response = self.client.delete(url, format='json')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Validate the comment has been deleted
        comment_instance = Comment.objects.get(pk = post_comment_response.data['id'])
        self.assertTrue(comment_instance.deleted)
 
    def test_like_comment(self):

        user_instance = self.register_account(self.mock_user1)
        article_instance = self.article('post', self.mock_article)
        comment_data = deepcopy(self.mock_comment)
        comment_data['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(self.CommentListCreate_name)
        post_comment_response = self.client.post(post_comment_url, comment_data, format='json')

        # Like a comment
        like_comment_url = reverse(self.CommentLike_name, kwargs={'pk': post_comment_response.data['id']}) 
        like_comment_response = self.client.post(like_comment_url)
        self.assertEqual(like_comment_response.status_code, status.HTTP_201_CREATED)

        # Validate the database
        comment_like_exist = CommentLike.objects.filter(comment=post_comment_response.data['id'], user=user_instance).exists()
        self.assertTrue(comment_like_exist)
        comment_instance = Comment.objects.get(pk=post_comment_response.data['id'])
        self.assertEqual(comment_instance.likes_count, 1)

    def test_unlike_comment(self):

        user_instance = self.register_account(self.mock_user1)
        article_instance = self.article('post', self.mock_article)
        comment_data = deepcopy(self.mock_comment)
        comment_data['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(self.CommentListCreate_name)
        post_comment_response = self.client.post(post_comment_url, comment_data, format='json')

        # Like a comment
        like_comment_url = reverse(self.CommentLike_name, kwargs={'pk': post_comment_response.data['id']}) 
        like_comment_response = self.client.post(like_comment_url)
        
        # Unlike a comment
        unlike_comment_url = reverse(self.CommentUnlike_name, kwargs={'pk': post_comment_response.data['id']}) 
        unlike_comment_response = self.client.post(unlike_comment_url)
        self.assertEqual(unlike_comment_response.status_code, status.HTTP_201_CREATED)

        # Validate the database
        comment_like_exist = CommentLike.objects.filter(comment=post_comment_response.data['id'], user=user_instance).exists()
        self.assertFalse(comment_like_exist)
        comment_instance = Comment.objects.get(pk=post_comment_response.data['id'])
        self.assertEqual(comment_instance.likes_count, 0)
      
    def post_comment(self, article_id, comment_id=False, instance=True):
        comment_data = deepcopy(self.mock_comment)
        comment_data['article'] = article_id
        
        if comment_id:
            comment_data['parent_comment'] = comment_id

        # Post a comment
        post_comment_url = reverse(self.CommentListCreate_name)
        response = self.client.post(post_comment_url, comment_data, format='json')

        if instance:
            return Comment.objects.get(pk=response.data['id'])
        
        return response
     
    def test_retrieve_an_article(self):

        user_instance = self.register_account(self.mock_user1)
        article_instance = self.article('post', self.mock_article)
        comment_instance = self.post_comment(article_instance.id)
        initial_user_preference = np.array(user_instance.embedding_vector)

        retrieve_an_article_url = reverse(self.ArticlePatchDetailDelete_name, kwargs={'pk':article_instance.id})
        retrieve_an_article_response = self.client.get(retrieve_an_article_url)
        self.assertEqual(retrieve_an_article_response.status_code, status.HTTP_200_OK)

        # Validate the article
        self.assertEqual(retrieve_an_article_response.data['results']['article']['id'], article_instance.id)

        # Validate the comment
        self.assertEqual(retrieve_an_article_response.data['results']['comments'][0]['id'], comment_instance.id)

        # Validate the preference embedding update
        user_instance = User.objects.get(pk=user_instance.id)
        updated_embedding = np.array(user_instance.embedding_vector)        
        self.assertFalse(np.allclose(initial_user_preference, updated_embedding))


    def test_retrieve_article_with_course_code(self):

        user_instance = self.register_account(self.mock_user1)
        
        mock_article = deepcopy(self.mock_article)
        mock_article['course_code'] = 'comp1231, Comp1320'        
        mock_article['unicon'] = False

        article_instance = self.article('post', mock_article)

        retrieve_an_article_url = reverse(self.ArticlePatchDetailDelete_name, kwargs={'pk':article_instance.id})
        retrieve_an_article_response = self.client.get(retrieve_an_article_url)
        self.assertEqual(retrieve_an_article_response.status_code, status.HTTP_200_OK)

    def test_retrieve_nested_comments(self):

        user_instance = self.register_account(self.mock_user1)
        article_instance = self.article('post', self.mock_article)
        comment_instance = self.post_comment(article_instance.id)
        nested_comment_instance = self.post_comment(article_instance.id, comment_instance.id)   

        retrieve_comment_url = reverse(self.CommentPatchDetailDelete_name, kwargs={'pk':comment_instance.id})
        retrieve_comment_response = self.client.get(retrieve_comment_url)
        self.assertEqual(retrieve_comment_response.status_code, status.HTTP_200_OK)

        self.assertEqual(nested_comment_instance.id, retrieve_comment_response.data['results']['nested_comments'][0]['id'])
        

    def test_retrieve_articles_sorted_by_time(self):

        self.register_account(self.mock_user1)
        for _ in range(10):
            self.article('post', self.mock_article)
        retrieve_articles_url = reverse(self.ArticleListCreate_name)
        retrieve_articles_response = self.client.get(retrieve_articles_url)
        self.assertEqual(retrieve_articles_response.status_code, status.HTTP_200_OK)

        # Validate Number of Articles
        self.assertEqual(Article.objects.count(), len(retrieve_articles_response.data['results']['articles']))

        # Validate the order of Articles
        articles = retrieve_articles_response.data['results']['articles']
        previous_article_time = datetime.strptime(articles[0]['created_at'], "%Y-%m-%dT%H:%M:%S.%fZ")
        for i in range(1, len(articles)):
            current_article_time = datetime.strptime(articles[i]['created_at'], "%Y-%m-%dT%H:%M:%S.%fZ")
            self.assertTrue(previous_article_time > current_article_time)

    

    def test_retrieve_articles_sorted_by_score(self):

        self.register_account(self.mock_user1)

        for i in range(10, 0, -1):
            article_instance = self.article('post', self.mock_article)
            for _ in range(i):
                self.post_comment(article_instance.id)

        retrieve_articles_url = reverse(self.ArticleScore_name)
        retrieve_articles_response = self.client.get(retrieve_articles_url)
        self.assertEqual(retrieve_articles_response.status_code, status.HTTP_200_OK)

        # Validate Number of Articles
        self.assertEqual(Article.objects.count(), len(retrieve_articles_response.data['results']['articles']))

        # Validate the order of Articles
        articles = retrieve_articles_response.data['results']['articles']
        previous_article_comment_count = articles[0]['comments_count']
        for i in range(1, len(articles)):
            current_article_comment_count = articles[i]['comments_count']
            self.assertTrue(previous_article_comment_count > current_article_comment_count)
     
    def test_retrieve_articles_sorted_by_preference(self):

        self.register_account(self.mock_user1)

        food_article = deepcopy(self.mock_article)
        food_article['body'] = "Food is a universal language that connects people across cultures and traditions. It’s not just about nourishment; it’s an expression of history, creativity, and community. From street food in bustling markets to gourmet meals in fine dining, every dish tells a story of flavors, techniques, and memories shared."
        food_article_instance = self.article('post', food_article)

        exam_article = deepcopy(self.mock_article)
        exam_article['body'] = "Exams are often used in educational settings, professional certifications, and recruitment processes to measure competence and understanding. Preparation, focus, and time management are key to success in exams."
        exam_article_instance = self.article('post', exam_article)
        
        retrieve_an_article_url = reverse(self.ArticlePatchDetailDelete_name, kwargs={'pk':food_article_instance.id})
        retrieve_an_article_response = self.client.get(retrieve_an_article_url)
        self.assertEqual(retrieve_an_article_response.status_code, status.HTTP_200_OK)
        
        retrieve_articles_url = reverse(self.ArticlePreference_name)
        retrieve_articles_response = self.client.get(retrieve_articles_url)
        self.assertEqual(retrieve_articles_response.status_code, status.HTTP_200_OK)

        # Validate the order of Articles
        articles = retrieve_articles_response.data['results']['articles']
        self.assertEqual(articles[0]['id'], food_article_instance.id)
        self.assertEqual(articles[1]['id'], exam_article_instance.id)

        # print(json.dumps(retrieve_comment_response.data, indent=4))