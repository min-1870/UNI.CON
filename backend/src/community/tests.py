from .models import Article, Course, ArticleCourse, ArticleLike, Comment, CommentLike, User  
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from datetime import datetime
from copy import deepcopy
import numpy as np
import json
from .constants import (
    SEPARATION_LINE,
    REGISTER_SUBMIT_URL,
    REGISTER_CONFIRM_VIEW_URL,

    ARTICLE_PATCH_DETAIL_DELETE_NAME,
    ARTICLE_LIST_CREATE_NAME,
    ARTICLE_SCORE_NAME,
    ARTICLE_PREFERENCE_NAME,
    ARTICLE_LIKE_NAME,
    ARTICLE_UNLIKE_NAME,

    COMMENT_PATCH_DETAIL_DELETE_NAME,
    COMMENT_LIST_CREATE_NAME,
    COMMENT_LIKE_NAME,
    COMMENT_UNLIKE_NAME,

    MOCK_ARTICLE,
    MOCK_ARTICLE_WITH_COURSES,
    MOCK_ARTICLE_RESPONSE_KEYS,
    MOCK_ARTICLE_2,

    MOCK_COMMENT,
    MOCK_COMMENT_RESPONSE_KEYS,
    MOCK_COMMENT,

    MOCK_USER_1,
    MOCK_USER_2,
    MOCK_USER_3,
)
    
def register_account(client, user_data, instance=True):
    #Register a new account
    response = client.post(REGISTER_SUBMIT_URL, user_data, format='json')
    #Apply token
    access_token = response.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    #Fetch validation code
    user_instance = User.objects.get(email=user_data['email'])
    validation_data = {'validation_code': user_instance.validation_code}
    response = client.post(REGISTER_CONFIRM_VIEW_URL, validation_data, format='json')
    if instance:
        return User.objects.get(email=user_data['email'])
    else:        
        return response
    
def article(client, restful, data, instance=True, kwargs=0):
    if restful == 'post':
        url = reverse(ARTICLE_LIST_CREATE_NAME)
        response = client.post(url, data, format='json')
    elif restful == 'patch':
        url = reverse(ARTICLE_PATCH_DETAIL_DELETE_NAME, kwargs=kwargs)
        response = client.patch(url, data, format='json')
    elif restful == 'delete':
        url = reverse(ARTICLE_PATCH_DETAIL_DELETE_NAME, kwargs=kwargs)
        response = client.delete(url, data, format='json')
    if instance:
        return Article.objects.get(pk=response.data['id'])
    else:
        return response    
    
def post_comment(client, article_id, comment_id=False, instance=True):
    modified_mock_comment = deepcopy(MOCK_COMMENT)
    modified_mock_comment['article'] = article_id
    
    if comment_id:
        modified_mock_comment['parent_comment'] = comment_id
    # Post a comment
    post_comment_url = reverse(COMMENT_LIST_CREATE_NAME)
    response = client.post(post_comment_url, modified_mock_comment, format='json')
    if instance:
        return Comment.objects.get(pk=response.data['id'])
    
    return response

class articleModificationTests(APITestCase):
    # Post, Like, Patch, Delete
    fixtures = ['fixtures.json']

    def setUp(self):
        self.client = APIClient()
    
    def test_post_article(self):

        user_instance = register_account(self.client, MOCK_USER_1)

        # Post an article
        url = reverse(ARTICLE_LIST_CREATE_NAME)
        response = self.client.post(url, MOCK_ARTICLE, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Validate existence of the article
        article_exist = Article.objects.filter(id=response.data['id']).exists()
        self.assertTrue(article_exist)
        article_instance = Article.objects.get(pk=response.data['id'])

        # Validate response structure
        article_keys = set(response.data.keys())
        self.assertSetEqual(article_keys, MOCK_ARTICLE_RESPONSE_KEYS)

        # Validate attributes
        self.assertEqual(user_instance, article_instance.user)
        self.assertEqual(MOCK_ARTICLE['title'], article_instance.title)
        self.assertEqual(MOCK_ARTICLE['body'], article_instance.body)
        self.assertEqual(MOCK_ARTICLE['unicon'], article_instance.unicon)

    def test_post_article_with_course(self):

        # Post an article with courses
        user_instance = register_account(self.client, MOCK_USER_1)
        url = reverse(ARTICLE_LIST_CREATE_NAME)
        response = self.client.post(url, MOCK_ARTICLE_WITH_COURSES, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Validate Article
        article_exist = Article.objects.filter(id=response.data['id']).exists()
        self.assertTrue(article_exist)
        article_instance = Article.objects.get(pk=response.data['id'])

        # Validate response structure
        article_keys = set(response.data.keys())
        self.assertSetEqual(article_keys, MOCK_ARTICLE_RESPONSE_KEYS)

        # Validate attributes
        self.assertEqual(user_instance, article_instance.user)
        self.assertEqual(MOCK_ARTICLE_WITH_COURSES['title'], article_instance.title)
        self.assertEqual(MOCK_ARTICLE_WITH_COURSES['body'], article_instance.body)
        self.assertEqual(MOCK_ARTICLE_WITH_COURSES['unicon'], article_instance.unicon)

        #Validate Course
        for code in MOCK_ARTICLE_WITH_COURSES['course_code'].split(','):

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
        # Post an article
        register_account(self.client, MOCK_USER_1, False)
        url = reverse(ARTICLE_LIST_CREATE_NAME)
        response = self.client.post(url, MOCK_ARTICLE, format='json')

        # Patch the article
        appended_body = {'body':'12345'}
        url = reverse(ARTICLE_PATCH_DETAIL_DELETE_NAME, kwargs={'pk': response.data['id']})
        response = self.client.patch(url, appended_body, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Validate response structure
        article_keys = set(response.data.keys())
        self.assertSetEqual(article_keys, MOCK_ARTICLE_RESPONSE_KEYS)
        
        # Validate the appended content
        article_instance = Article.objects.get(pk=response.data['id'])
        self.assertEqual(article_instance.body, MOCK_ARTICLE['body'] + SEPARATION_LINE + appended_body['body'])

    def test_patch_article_by_other(self):
        # Post an article
        register_account(self.client, MOCK_USER_1, False)
        url = reverse(ARTICLE_LIST_CREATE_NAME)
        response = self.client.post(url, MOCK_ARTICLE, format='json')

        # Register a new account
        self.client.credentials()
        register_account(self.client, MOCK_USER_2, False)

        # Patch the article
        appended_body = {'body':'12345'}
        url = reverse(ARTICLE_PATCH_DETAIL_DELETE_NAME, kwargs={'pk': response.data['id']})
        response = self.client.patch(url, appended_body, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_article(self):

        # Post a article
        register_account(self.client, MOCK_USER_1, False)
        url = reverse(ARTICLE_LIST_CREATE_NAME)
        post_response = self.client.post(url, MOCK_ARTICLE, format='json')

        # Delete the article
        url = reverse(ARTICLE_PATCH_DETAIL_DELETE_NAME, kwargs={'pk':post_response.data['id']})
        delete_response = self.client.delete(url, format='json')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Validate the article has been deleted
        article_instance = Article.objects.get(pk=post_response.data['id'])
        self.assertTrue(article_instance.deleted)
    
    def test_delete_article_by_other(self):
        # Post an article
        register_account(self.client, MOCK_USER_1, False)
        url = reverse(ARTICLE_LIST_CREATE_NAME)
        post_response = self.client.post(url, MOCK_ARTICLE, format='json')

        # Register a new account
        self.client.credentials()
        register_account(self.client, MOCK_USER_2, False)

        # Delete the article
        url = reverse(ARTICLE_PATCH_DETAIL_DELETE_NAME, kwargs={'pk':post_response.data['id']})
        delete_response = self.client.delete(url, format='json')
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_like_article(self):
        # Post an article
        user_instance = register_account(self.client, MOCK_USER_1)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)

        # Like an article
        like_article_url = reverse(ARTICLE_LIKE_NAME, kwargs={'pk': article_instance.id}) 
        like_article_response = self.client.post(like_article_url)
        self.assertEqual(like_article_response.status_code, status.HTTP_200_OK)
        
        # Validate the relational data
        article_like_exist = ArticleLike.objects.filter(article=article_instance, user=user_instance).exists()
        self.assertTrue(article_like_exist)
        article_instance = Article.objects.get(pk=article_instance.id)
        self.assertEqual(article_instance.likes_count, 1)

    def test_like_article_again(self):
        # Post an article
        user_instance = register_account(self.client, MOCK_USER_1)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)

        # Like an article
        like_article_url = reverse(ARTICLE_LIKE_NAME, kwargs={'pk': article_instance.id}) 
        like_article_response = self.client.post(like_article_url)
        self.assertEqual(like_article_response.status_code, status.HTTP_200_OK)

        # Like an article
        like_article_url = reverse(ARTICLE_LIKE_NAME, kwargs={'pk': article_instance.id}) 
        like_article_response = self.client.post(like_article_url)
        self.assertEqual(like_article_response.status_code, status.HTTP_304_NOT_MODIFIED)

    def test_like_article_by_other(self):
        # Post an article
        register_account(self.client, MOCK_USER_1, False)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        
        # Register a new account
        self.client.credentials()
        user_instance = register_account(self.client, MOCK_USER_2)

        # Like an article
        like_article_url = reverse(ARTICLE_LIKE_NAME, kwargs={'pk': article_instance.id}) 
        like_article_response = self.client.post(like_article_url)
        self.assertEqual(like_article_response.status_code, status.HTTP_200_OK)
        
        # Validate the relational data
        article_like_exist = ArticleLike.objects.filter(article=article_instance, user=user_instance).exists()
        self.assertTrue(article_like_exist)
        article_instance = Article.objects.get(pk=article_instance.id)
        self.assertEqual(article_instance.likes_count, 1)
    
    def test_block_like_article_by_other_schools(self):
        register_account(self.client, MOCK_USER_1, False)
        article_instance = article(self.client, 'post', MOCK_ARTICLE_2)
        
        self.client.credentials()
        register_account(self.client, MOCK_USER_3, False)

        like_article_url = reverse(ARTICLE_LIKE_NAME, kwargs={'pk': article_instance.id}) 
        like_article_response = self.client.post(like_article_url)
        self.assertEqual(like_article_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unlike_article(self):
        # Post an article
        user_instance = register_account(self.client, MOCK_USER_1)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)

        # Like an article
        like_article_url = reverse(ARTICLE_LIKE_NAME, kwargs={'pk': article_instance.id}) 
        self.client.post(like_article_url)

        # Unlike an article
        unlike_article_url = reverse(ARTICLE_UNLIKE_NAME, kwargs={'pk': article_instance.id}) 
        unlike_article_response = self.client.post(unlike_article_url)
        self.assertEqual(unlike_article_response.status_code, status.HTTP_200_OK)

        # Validate the relational data
        article_like_exist = ArticleLike.objects.filter(article=article_instance, user=user_instance).exists()
        self.assertFalse(article_like_exist)
        self.assertEqual(article_instance.likes_count, 0)

    def test_block_unlike_article_again(self):
        # Post an article
        register_account(self.client, MOCK_USER_1, False)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)

        # Unlike an article
        unlike_article_url = reverse(ARTICLE_UNLIKE_NAME, kwargs={'pk': article_instance.id}) 
        unlike_article_response = self.client.post(unlike_article_url)
        self.assertEqual(unlike_article_response.status_code, status.HTTP_304_NOT_MODIFIED)
    
    def test_unlike_article_by_other(self):
        # Post an article
        register_account(self.client, MOCK_USER_1, False)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        
        # Register a new account
        self.client.credentials()
        user_instance = register_account(self.client, MOCK_USER_2)

        # Like an article
        like_article_url = reverse(ARTICLE_LIKE_NAME, kwargs={'pk': article_instance.id}) 
        like_article_response = self.client.post(like_article_url)
        self.assertEqual(like_article_response.status_code, status.HTTP_200_OK)

        # Unlike an article
        unlike_article_url = reverse(ARTICLE_UNLIKE_NAME, kwargs={'pk': article_instance.id}) 
        unlike_article_response = self.client.post(unlike_article_url)
        self.assertEqual(unlike_article_response.status_code, status.HTTP_200_OK)
        
        # Validate the relational data
        article_like_exist = ArticleLike.objects.filter(article=article_instance, user=user_instance).exists()
        self.assertFalse(article_like_exist)
        article_instance = Article.objects.get(pk=article_instance.id)
        self.assertEqual(article_instance.likes_count, 0)

class articleRetrieveTests(APITestCase):
    # Get article(s)

    fixtures = ['fixtures.json']

    def setUp(self):
        self.client = APIClient()
     
    def test_retrieve_an_article(self):
        # Post an article and comment
        user_instance = register_account(self.client, MOCK_USER_1)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        comment_instance = post_comment(self.client, article_instance.id)
        initial_user_preference = np.array(user_instance.embedding_vector)

        retrieve_an_article_url = reverse(ARTICLE_PATCH_DETAIL_DELETE_NAME, kwargs={'pk':article_instance.id})
        retrieve_an_article_response = self.client.get(retrieve_an_article_url)
        self.assertEqual(retrieve_an_article_response.status_code, status.HTTP_200_OK)

        # Validate the article response structure
        article_keys = set(retrieve_an_article_response.data['results']['article'].keys())
        self.assertSetEqual(article_keys, MOCK_ARTICLE_RESPONSE_KEYS)

        # Validate the article
        self.assertEqual(retrieve_an_article_response.data['results']['article']['id'], article_instance.id)

        # Validate the comment response structure
        comment_keys = set(retrieve_an_article_response.data['results']['comments'][0].keys())
        self.assertSetEqual(comment_keys, MOCK_COMMENT_RESPONSE_KEYS)

        # Validate the comment
        self.assertEqual(retrieve_an_article_response.data['results']['comments'][0]['id'], comment_instance.id)

        # Validate the preference embedding update
        user_instance = User.objects.get(pk=user_instance.id)
        updated_embedding = np.array(user_instance.embedding_vector)        
        self.assertFalse(np.allclose(initial_user_preference, updated_embedding))

    def test_block_retrieve_article_by_other_schools(self):
        register_account(self.client, MOCK_USER_1, False)
        article_instance = article(self.client, 'post', MOCK_ARTICLE_2)
        
        self.client.credentials()
        register_account(self.client, MOCK_USER_3, False)

        retrieve_an_article_url = reverse(ARTICLE_PATCH_DETAIL_DELETE_NAME, kwargs={'pk':article_instance.id})
        retrieve_an_article_response = self.client.get(retrieve_an_article_url)
        self.assertEqual(retrieve_an_article_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_article_with_course_code(self):

        user_instance = register_account(self.client, MOCK_USER_1)
        article_instance = article(self.client, 'post', MOCK_ARTICLE_WITH_COURSES)
        comment_instance = post_comment(self.client, article_instance.id)
        initial_user_preference = np.array(user_instance.embedding_vector)

        retrieve_an_article_url = reverse(ARTICLE_PATCH_DETAIL_DELETE_NAME, kwargs={'pk':article_instance.id})
        retrieve_an_article_response = self.client.get(retrieve_an_article_url)
        self.assertEqual(retrieve_an_article_response.status_code, status.HTTP_200_OK)

        # Validate the response structure
        article_keys = set(retrieve_an_article_response.data['results']['article'].keys())
        self.assertSetEqual(article_keys, MOCK_ARTICLE_RESPONSE_KEYS)

        # Validate the article
        self.assertEqual(retrieve_an_article_response.data['results']['article']['id'], article_instance.id)

        # Validate the comment response structure
        comment_keys = set(retrieve_an_article_response.data['results']['comments'][0].keys())
        self.assertSetEqual(comment_keys, MOCK_COMMENT_RESPONSE_KEYS)

        # Validate the comment
        self.assertEqual(retrieve_an_article_response.data['results']['comments'][0]['id'], comment_instance.id)

        # Validate the preference embedding update
        user_instance = User.objects.get(pk=user_instance.id)
        updated_embedding = np.array(user_instance.embedding_vector)        
        self.assertFalse(np.allclose(initial_user_preference, updated_embedding))
    
    def test_retrieve_articles_sorted_by_time(self):

        register_account(self.client, MOCK_USER_1)
        for _ in range(10):
            article(self.client, 'post', MOCK_ARTICLE)
        retrieve_articles_url = reverse(ARTICLE_LIST_CREATE_NAME)
        retrieve_articles_response = self.client.get(retrieve_articles_url)
        self.assertEqual(retrieve_articles_response.status_code, status.HTTP_200_OK)

        # Validate Number of Articles
        self.assertEqual(Article.objects.count(), len(retrieve_articles_response.data['results']['articles']))

        # Validate the order of Articles
        articles = retrieve_articles_response.data['results']['articles']
        previous_article_time = datetime.strptime(articles[0]['created_at'], "%Y-%m-%dT%H:%M:%S.%fZ")
        for i in range(1, len(articles)):
            
            # Validate the response structure
            self.assertSetEqual(set(articles[i].keys()), MOCK_ARTICLE_RESPONSE_KEYS)
            
            # Validate the order
            current_article_time = datetime.strptime(articles[i]['created_at'], "%Y-%m-%dT%H:%M:%S.%fZ")
            self.assertTrue(previous_article_time > current_article_time)
        
    def test_retrieve_articles_sorted_by_score(self):

        register_account(self.client, MOCK_USER_1)

        for i in range(10, 0, -1):
            article_instance = article(self.client, 'post', MOCK_ARTICLE)
            for _ in range(i):
                post_comment(self.client, article_instance.id)

        retrieve_articles_url = reverse(ARTICLE_SCORE_NAME)
        retrieve_articles_response = self.client.get(retrieve_articles_url)
        self.assertEqual(retrieve_articles_response.status_code, status.HTTP_200_OK)

        # Validate Number of Articles
        self.assertEqual(Article.objects.count(), len(retrieve_articles_response.data['results']['articles']))

        # Validate the order of Articles
        articles = retrieve_articles_response.data['results']['articles']
        previous_article_comment_count = articles[0]['comments_count']
        for i in range(1, len(articles)):
            
            # Validate the response structure 
            self.assertSetEqual(set(articles[i].keys()), MOCK_ARTICLE_RESPONSE_KEYS)

            # Validate the order
            current_article_comment_count = articles[i]['comments_count']
            self.assertTrue(previous_article_comment_count > current_article_comment_count)
     
    def test_retrieve_articles_sorted_by_preference(self):

        register_account(self.client, MOCK_USER_1)

        food_article = deepcopy(MOCK_ARTICLE)
        food_article['body'] = "Food is a universal language that connects people across cultures and traditions. It’s not just about nourishment; it’s an expression of history, creativity, and community. From street food in bustling markets to gourmet meals in fine dining, every dish tells a story of flavors, techniques, and memories shared."
        food_article_instance = article(self.client, 'post', food_article)

        exam_article = deepcopy(MOCK_ARTICLE)
        exam_article['body'] = "Exams are often used in educational settings, professional certifications, and recruitment processes to measure competence and understanding. Preparation, focus, and time management are key to success in exams."
        exam_article_instance = article(self.client, 'post', exam_article)
        
        retrieve_an_article_url = reverse(ARTICLE_PATCH_DETAIL_DELETE_NAME, kwargs={'pk':food_article_instance.id})
        retrieve_an_article_response = self.client.get(retrieve_an_article_url)
        self.assertEqual(retrieve_an_article_response.status_code, status.HTTP_200_OK)
        
        retrieve_articles_url = reverse(ARTICLE_PREFERENCE_NAME)
        retrieve_articles_response = self.client.get(retrieve_articles_url)
        self.assertEqual(retrieve_articles_response.status_code, status.HTTP_200_OK)
    
        # Validate the response structure
        articles = retrieve_articles_response.data['results']['articles']        
        self.assertSetEqual(set(articles[0].keys()), MOCK_ARTICLE_RESPONSE_KEYS)
        self.assertSetEqual(set(articles[1].keys()), MOCK_ARTICLE_RESPONSE_KEYS)

        # Validate the order of Articles
        self.assertEqual(articles[0]['id'], food_article_instance.id)
        self.assertEqual(articles[1]['id'], exam_article_instance.id)

        # print(json.dumps(retrieve_articles_response.data, indent=4))

class commentModificationTests(APITestCase):
    # Post, Like, Patch, Delete
    
    fixtures = ['fixtures.json']

    def setUp(self):
        self.client = APIClient()
    
    def test_post_comment(self):

        user_instance = register_account(self.client, MOCK_USER_1)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        modified_mock_comment = deepcopy(MOCK_COMMENT)
        modified_mock_comment['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(COMMENT_LIST_CREATE_NAME)
        post_comment_response = self.client.post(post_comment_url, modified_mock_comment, format='json')
        self.assertEqual(post_comment_response.status_code, status.HTTP_201_CREATED)
        
        # Validate the database
        exist = Comment.objects.filter(id=post_comment_response.data['id']).exists
        self.assertTrue(exist)
        comment_instance = Comment.objects.get(pk=post_comment_response.data['id'])
        self.assertEqual(comment_instance.user, user_instance)
        self.assertEqual(comment_instance.body, modified_mock_comment['body'])
        article_instance = Article.objects.get(pk=article_instance.id)
        self.assertEqual(article_instance.comments_count, 1)

    def test_post_nested_comment(self):

        user_instance = register_account(self.client, MOCK_USER_1)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        modified_mock_comment = deepcopy(MOCK_COMMENT)
        modified_mock_comment['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(COMMENT_LIST_CREATE_NAME)
        post_comment_response = self.client.post(post_comment_url, modified_mock_comment, format='json')
        
        # Post a nested comment
        modified_mock_comment['parent_comment'] = post_comment_response.data['id']
        post_nested_comment_url = reverse(COMMENT_LIST_CREATE_NAME)
        post_nested_comment_response = self.client.post(post_nested_comment_url, modified_mock_comment, format='json')
        self.assertEqual(post_nested_comment_response.status_code, status.HTTP_201_CREATED)
        
        # Validate the database
        exist = Comment.objects.filter(id=post_nested_comment_response.data['id']).exists
        self.assertTrue(exist)
        comment_instance = Comment.objects.get(pk=post_nested_comment_response.data['id'])
        self.assertEqual(comment_instance.user, user_instance)
        self.assertEqual(comment_instance.body, modified_mock_comment['body'])
        parent_comment_instance = Comment.objects.get(pk=post_comment_response.data['id'])
        self.assertEqual(parent_comment_instance.comments_count, 1)
        article_instance = Article.objects.get(pk=article_instance.id)
        self.assertEqual(article_instance.comments_count, 2)
    
    def test_block_post_comment_by_other_schools(self):
        register_account(self.client, MOCK_USER_1, False)
        article_instance = article(self.client, 'post', MOCK_ARTICLE_WITH_COURSES)
        
        self.client.credentials()
        register_account(self.client, MOCK_USER_3, False)

        modified_mock_comment = deepcopy(MOCK_COMMENT)
        modified_mock_comment['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(COMMENT_LIST_CREATE_NAME)
        post_comment_response = self.client.post(post_comment_url, modified_mock_comment, format='json')
        self.assertEqual(post_comment_response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_patch_comment(self):

        user_instance = register_account(self.client, MOCK_USER_1)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        modified_mock_comment = deepcopy(MOCK_COMMENT)
        modified_mock_comment['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(COMMENT_LIST_CREATE_NAME)
        post_comment_response = self.client.post(post_comment_url, modified_mock_comment, format='json')
        
        # Patch the comment
        modified_mock_comment = {'body':'12345'}
        patch_comment_url = reverse(COMMENT_PATCH_DETAIL_DELETE_NAME, kwargs={'pk':post_comment_response.data['id']})
        patch_comment_response = self.client.patch(patch_comment_url, modified_mock_comment, format='json')
        self.assertEqual(patch_comment_response.status_code, status.HTTP_200_OK)
        
        # Validate the database
        comment_instance = Comment.objects.get(pk=patch_comment_response.data['id'])
        self.assertEqual(comment_instance.user, user_instance)
        self.assertEqual(comment_instance.body, modified_mock_comment['body'])

    def test_patch_comment_by_other(self):

        register_account(self.client, MOCK_USER_1, False)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        modified_mock_comment = deepcopy(MOCK_COMMENT)
        modified_mock_comment['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(COMMENT_LIST_CREATE_NAME)
        post_comment_response = self.client.post(post_comment_url, modified_mock_comment, format='json')

        # Register a new account
        self.client.credentials()
        register_account(self.client, MOCK_USER_2, False)
        
        # Patch the comment
        modified_mock_comment = {'body':'12345'}
        patch_comment_url = reverse(COMMENT_PATCH_DETAIL_DELETE_NAME, kwargs={'pk':post_comment_response.data['id']})
        patch_comment_response = self.client.patch(patch_comment_url, modified_mock_comment, format='json')
        self.assertEqual(patch_comment_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_comment(self):

        register_account(self.client, MOCK_USER_1, False)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        modified_mock_comment = deepcopy(MOCK_COMMENT)
        modified_mock_comment['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(COMMENT_LIST_CREATE_NAME)
        post_comment_response = self.client.post(post_comment_url, modified_mock_comment, format='json')

        # Delete the comment
        url = reverse(COMMENT_PATCH_DETAIL_DELETE_NAME, kwargs={'pk':post_comment_response.data['id']})
        delete_response = self.client.delete(url, format='json')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Validate the comment has been deleted
        comment_instance = Comment.objects.get(pk = post_comment_response.data['id'])
        self.assertTrue(comment_instance.deleted)

    def test_delete_comment_by_other(self):

        register_account(self.client, MOCK_USER_1, False)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        modified_mock_comment = deepcopy(MOCK_COMMENT)
        modified_mock_comment['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(COMMENT_LIST_CREATE_NAME)
        post_comment_response = self.client.post(post_comment_url, modified_mock_comment, format='json')

        # Register a new account
        self.client.credentials()
        register_account(self.client, MOCK_USER_2, False)

        # Delete the comment
        url = reverse(COMMENT_PATCH_DETAIL_DELETE_NAME, kwargs={'pk':post_comment_response.data['id']})
        delete_response = self.client.delete(url, format='json')
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)
 
    def test_like_comment(self):

        user_instance = register_account(self.client, MOCK_USER_1)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        modified_mock_comment = deepcopy(MOCK_COMMENT)
        modified_mock_comment['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(COMMENT_LIST_CREATE_NAME)
        post_comment_response = self.client.post(post_comment_url, modified_mock_comment, format='json')

        # Like a comment
        like_comment_url = reverse(COMMENT_LIKE_NAME, kwargs={'pk': post_comment_response.data['id']}) 
        like_comment_response = self.client.post(like_comment_url)
        self.assertEqual(like_comment_response.status_code, status.HTTP_201_CREATED)

        # Validate the database
        comment_like_exist = CommentLike.objects.filter(comment=post_comment_response.data['id'], user=user_instance).exists()
        self.assertTrue(comment_like_exist)
        comment_instance = Comment.objects.get(pk=post_comment_response.data['id'])
        self.assertEqual(comment_instance.likes_count, 1)

    def test_like_comment_again(self):

        register_account(self.client, MOCK_USER_1, False)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        modified_mock_comment = deepcopy(MOCK_COMMENT)
        modified_mock_comment['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(COMMENT_LIST_CREATE_NAME)
        post_comment_response = self.client.post(post_comment_url, modified_mock_comment, format='json')

        # Like a comment
        like_comment_url = reverse(COMMENT_LIKE_NAME, kwargs={'pk': post_comment_response.data['id']}) 
        like_comment_response = self.client.post(like_comment_url)
        self.assertEqual(like_comment_response.status_code, status.HTTP_201_CREATED)

        # Like a comment
        like_comment_url = reverse(COMMENT_LIKE_NAME, kwargs={'pk': post_comment_response.data['id']}) 
        like_comment_response = self.client.post(like_comment_url)
        self.assertEqual(like_comment_response.status_code, status.HTTP_304_NOT_MODIFIED)

    def test_like_by_other(self):

        register_account(self.client, MOCK_USER_1, False)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        modified_mock_comment = deepcopy(MOCK_COMMENT)
        modified_mock_comment['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(COMMENT_LIST_CREATE_NAME)
        post_comment_response = self.client.post(post_comment_url, modified_mock_comment, format='json')

        # Register a new account
        self.client.credentials()
        user_instance = register_account(self.client, MOCK_USER_2)

        # Like a comment
        like_comment_url = reverse(COMMENT_LIKE_NAME, kwargs={'pk': post_comment_response.data['id']}) 
        like_comment_response = self.client.post(like_comment_url)
        self.assertEqual(like_comment_response.status_code, status.HTTP_201_CREATED)

        # Validate the database
        comment_like_exist = CommentLike.objects.filter(comment=post_comment_response.data['id'], user=user_instance).exists()
        self.assertTrue(comment_like_exist)
        comment_instance = Comment.objects.get(pk=post_comment_response.data['id'])
        self.assertEqual(comment_instance.likes_count, 1)
    
    def test_block_like_comment_by_other_schools(self):
        register_account(self.client, MOCK_USER_1, False)
        article_instance = article(self.client, 'post', MOCK_ARTICLE_WITH_COURSES)
        comment_instance = post_comment(self.client, article_instance.id)
        
        self.client.credentials()
        register_account(self.client, MOCK_USER_3, False)
        
        # Like a comment
        like_comment_url = reverse(COMMENT_LIKE_NAME, kwargs={'pk': comment_instance.id}) 
        like_comment_response = self.client.post(like_comment_url)
        self.assertEqual(like_comment_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unlike_comment(self):

        user_instance = register_account(self.client, MOCK_USER_1)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        modified_mock_comment = deepcopy(MOCK_COMMENT)
        modified_mock_comment['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(COMMENT_LIST_CREATE_NAME)
        post_comment_response = self.client.post(post_comment_url, modified_mock_comment, format='json')

        # Like a comment
        like_comment_url = reverse(COMMENT_LIKE_NAME, kwargs={'pk': post_comment_response.data['id']}) 
        like_comment_response = self.client.post(like_comment_url)
        
        # Unlike a comment
        unlike_comment_url = reverse(COMMENT_UNLIKE_NAME, kwargs={'pk': post_comment_response.data['id']}) 
        unlike_comment_response = self.client.post(unlike_comment_url)
        self.assertEqual(unlike_comment_response.status_code, status.HTTP_201_CREATED)

        # Validate the database
        comment_like_exist = CommentLike.objects.filter(comment=post_comment_response.data['id'], user=user_instance).exists()
        self.assertFalse(comment_like_exist)
        comment_instance = Comment.objects.get(pk=post_comment_response.data['id'])
        self.assertEqual(comment_instance.likes_count, 0)

    def test_unlike_comment_again(self):

        register_account(self.client, MOCK_USER_1, False)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        modified_mock_comment = deepcopy(MOCK_COMMENT)
        modified_mock_comment['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(COMMENT_LIST_CREATE_NAME)
        post_comment_response = self.client.post(post_comment_url, modified_mock_comment, format='json')
        
        # Unlike a comment
        unlike_comment_url = reverse(COMMENT_UNLIKE_NAME, kwargs={'pk': post_comment_response.data['id']}) 
        unlike_comment_response = self.client.post(unlike_comment_url)
        self.assertEqual(unlike_comment_response.status_code, status.HTTP_304_NOT_MODIFIED)

    def test_unlike_comment_by_other(self):

        register_account(self.client, MOCK_USER_1, False)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        modified_mock_comment = deepcopy(MOCK_COMMENT)
        modified_mock_comment['article'] = article_instance.id
        
        # Post a comment
        post_comment_url = reverse(COMMENT_LIST_CREATE_NAME)
        post_comment_response = self.client.post(post_comment_url, modified_mock_comment, format='json')

        # Register a new account
        self.client.credentials()
        user_instance = register_account(self.client, MOCK_USER_2)

        # Like a comment
        like_comment_url = reverse(COMMENT_LIKE_NAME, kwargs={'pk': post_comment_response.data['id']}) 
        like_comment_response = self.client.post(like_comment_url)
        self.assertEqual(like_comment_response.status_code, status.HTTP_201_CREATED)
        
        # Unlike a comment
        unlike_comment_url = reverse(COMMENT_UNLIKE_NAME, kwargs={'pk': post_comment_response.data['id']}) 
        unlike_comment_response = self.client.post(unlike_comment_url)
        self.assertEqual(unlike_comment_response.status_code, status.HTTP_201_CREATED)

        # Validate the database
        comment_like_exist = CommentLike.objects.filter(comment=post_comment_response.data['id'], user=user_instance).exists()
        self.assertFalse(comment_like_exist)
        comment_instance = Comment.objects.get(pk=post_comment_response.data['id'])
        self.assertEqual(comment_instance.likes_count, 0)

class commentRetrieveTests(APITestCase):
    # Get comments
    fixtures = ['fixtures.json']

    def setUp(self):
        self.client = APIClient()

    def test_retrieve_nested_comments(self):

        register_account(self.client, MOCK_USER_1)
        article_instance = article(self.client, 'post', MOCK_ARTICLE)
        comment_instance = post_comment(self.client, article_instance.id)
        nested_comment_instance = post_comment(self.client, article_instance.id, comment_instance.id)   

        retrieve_comment_url = reverse(COMMENT_PATCH_DETAIL_DELETE_NAME, kwargs={'pk':comment_instance.id})
        retrieve_comment_response = self.client.get(retrieve_comment_url)
        self.assertEqual(retrieve_comment_response.status_code, status.HTTP_200_OK)

        # Validate the comment response structure
        comment_keys = set(retrieve_comment_response.data['results']['comment'].keys())
        self.assertSetEqual(comment_keys, MOCK_COMMENT_RESPONSE_KEYS)

        # Validate the comment
        self.assertEqual(retrieve_comment_response.data['results']['comment']['id'], comment_instance.id)

        # Validate the nested comment response structure
        nested_comment_keys = set(retrieve_comment_response.data['results']['nested_comments'][0].keys())
        self.assertSetEqual(nested_comment_keys, MOCK_COMMENT_RESPONSE_KEYS)
        
        # Validate the nested comment
        self.assertEqual(nested_comment_instance.id, retrieve_comment_response.data['results']['nested_comments'][0]['id'])

