from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from .models import User  
from copy import deepcopy
from .constants import LOGIN_NAME, REGISTER_NAME, VALIDATE_NAME, MOCK_USER, USER_RESPONSE_KEYS


def request(client, name, data={}):
    if name == LOGIN_NAME:
        return client.post(reverse(name), data, format='json')
    elif name == REGISTER_NAME:
        return client.post(reverse(name), data, format='json')
    elif name == VALIDATE_NAME:
        return client.post(reverse(name), data, format='json')


class AccountAppViewTest(APITestCase):
    fixtures = ['fixtures.json']
    def setUp(self):
        self.client = APIClient()

    def test_register(self):
        response = request(self.client, REGISTER_NAME, MOCK_USER)

        # Validate status code
        self.assertIs(response.status_code, status.HTTP_201_CREATED)

        # Validate response structure
        keys = set(response.data.keys())
        self.assertSetEqual(keys, USER_RESPONSE_KEYS)

        # Validate DB
        user_instance = User.objects.filter(pk=response.data['id']).first()
        self.assertIsNotNone(user_instance)
        self.assertEqual(user_instance.email, MOCK_USER['email'])
        self.assertFalse(user_instance.is_validated)

    def test_register_with_used_email(self):
        response = request(self.client, REGISTER_NAME, MOCK_USER)
        response = request(self.client, REGISTER_NAME, MOCK_USER)
        
        # Validate status code
        self.assertIs(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate(self):
        response = request(self.client, REGISTER_NAME, MOCK_USER)
        user_instance = User.objects.get(pk=response.data['id'])        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data['access']}')
        response = request(self.client, VALIDATE_NAME, {'validation_code':user_instance.validation_code})

        # Validate status code
        self.assertIs(response.status_code, status.HTTP_200_OK)

        # Validate response structure
        keys = set(response.data.keys())
        self.assertSetEqual(keys, USER_RESPONSE_KEYS)

        # Validate DB
        user_instance.refresh_from_db()
        self.assertTrue(user_instance.is_validated)

    def test_login(self):
        response = request(self.client, REGISTER_NAME, MOCK_USER)
        user_instance = User.objects.get(pk=response.data['id'])        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data['access']}')
        response = request(self.client, VALIDATE_NAME, {'validation_code':user_instance.validation_code})
        self.client.credentials()

        response = request(self.client, LOGIN_NAME, MOCK_USER)

        # Validate status code
        self.assertIs(response.status_code, status.HTTP_200_OK)

        # Validate response structure
        keys = set(response.data.keys())
        self.assertSetEqual(keys, USER_RESPONSE_KEYS)
        
'''
    def test_RegisterSubmitView_used_email(self):
        response = self.client.post(self.RegisterSubmitView_url, self.mock_user, format='json')
        response = self.client.post(self.RegisterSubmitView_url, self.mock_user, format='json')
        self.assertIs(response.status_code, status.HTTP_400_BAD_REQUEST, "Wrong response status..")

    def test_RegisterSubmitView_invalid_email(self):
        data = deepcopy(self.mock_user)
        data['email'] = 'fakeemail@google.com'
        response = self.client.post(self.RegisterSubmitView_url, data, format='json')
        self.assertIs(response.status_code, status.HTTP_400_BAD_REQUEST, "Wrong response status..")

    def test_RegisterSubmitView_invalid_school(self):
        data = deepcopy(self.mock_user)
        data['email'] = 'fakeemail@google.edu'
        response = self.client.post(self.RegisterSubmitView_url, data, format='json')
        self.assertIs(response.status_code, status.HTTP_400_BAD_REQUEST, "Wrong response status..")

    def test_RegisterConfirmView_valid_code(self):
        register_response = self.client.post(self.RegisterSubmitView_url, self.mock_user, format='json')
        self.assertIs(register_response.status_code, status.HTTP_201_CREATED, "Wrong response status..")
        access_token = register_response.data['access']

        user = User.objects.get(email=self.mock_user['email'])
        data = {'validation_code': user.validation_code}

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.post(self.RegisterConfirmView_url, data, format='json')
        self.assertIs(response.status_code, status.HTTP_202_ACCEPTED, "Wrong response status..")

        user = User.objects.get(email=self.mock_user['email'])
        self.assertIs(user.is_validated, True, "Wrong is_validated value..")
        
        self.client.credentials()

    def test_RegisterConfirmView_invalid_code(self):
        register_response = self.client.post(self.RegisterSubmitView_url, self.mock_user, format='json')
        self.assertIs(register_response.status_code, status.HTTP_201_CREATED, "Wrong response status..")
        access_token = register_response.data['access']

        data = {'validation_code': '000000'}

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.post(self.RegisterConfirmView_url, data, format='json')
        self.assertIs(response.status_code, status.HTTP_401_UNAUTHORIZED, "Wrong response status..")

        user = User.objects.get(email=self.mock_user['email'])
        self.assertIs(user.is_validated, False, "Wrong is_validated value..")
        
        self.client.credentials()

    def test_RegisterConfirmView_validated_account(self):
        register_response = self.client.post(self.RegisterSubmitView_url, self.mock_user, format='json')
        self.assertIs(register_response.status_code, status.HTTP_201_CREATED, "Wrong response status..")
        access_token = register_response.data['access']

        user = User.objects.get(email=self.mock_user['email'])
        data = {'validation_code': user.validation_code}

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.post(self.RegisterConfirmView_url, data, format='json')
        self.assertIs(response.status_code, status.HTTP_202_ACCEPTED, "Wrong response status..")

        user = User.objects.get(email=self.mock_user['email'])
        self.assertIs(user.is_validated, True, "Wrong is_validated value..")

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.post(self.RegisterConfirmView_url, data, format='json')
        self.assertIs(response.status_code, status.HTTP_401_UNAUTHORIZED, "Wrong response status..")
        
        self.client.credentials()

    def test_RegisterConfirmView_validated_account(self):
        register_response = self.client.post(self.RegisterSubmitView_url, self.mock_user, format='json')
        self.assertIs(register_response.status_code, status.HTTP_201_CREATED, "Wrong response status..")

        user = User.objects.get(email=self.mock_user['email'])
        data = {'validation_code': user.validation_code}
        
        response = self.client.post(self.RegisterConfirmView_url, data, format='json')
        self.assertIs(response.status_code, status.HTTP_401_UNAUTHORIZED, "Wrong response status..")

        user = User.objects.get(email=self.mock_user['email'])
        self.assertIs(user.is_validated, False, "Wrong is_validated value..")
        

    def test_LoginSubmitView_correct_email_password_validated_account(self):
        register_response = self.client.post(self.RegisterSubmitView_url, self.mock_user, format='json')
        self.assertIs(register_response.status_code, status.HTTP_201_CREATED, "Wrong response status..")
        access_token = register_response.data['access']

        user = User.objects.get(email=self.mock_user['email'])
        data = {'validation_code': user.validation_code}

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.post(self.RegisterConfirmView_url, data, format='json')
        self.assertIs(response.status_code, status.HTTP_202_ACCEPTED, "Wrong response status..")

        user = User.objects.get(email=self.mock_user['email'])
        self.assertIs(user.is_validated, True, "Wrong is_validated value..")

        response = self.client.post(self.RegisterConfirmView_url, data, format='json')
        self.assertIs(response.status_code, status.HTTP_401_UNAUTHORIZED, "Wrong response status..")
        
        self.client.credentials()

        data = {'email':self.mock_user['email'], 'password':self.mock_user['password']}
        response = self.client.post(self.LoginSubmitView_url, data, format='json')
        self.assertIs(response.status_code, status.HTTP_202_ACCEPTED, "Wrong response status..")
        self.assertIn("refresh", response.data.keys(), "Missing refresh token..")
        self.assertIn("access", response.data.keys(), "Missing access token..")

    def test_LoginSubmitView_correct_email_password_invalidated_account(self):
        register_response = self.client.post(self.RegisterSubmitView_url, self.mock_user, format='json')
        self.assertIs(register_response.status_code, status.HTTP_201_CREATED, "Wrong response status..")

        data = {'email':self.mock_user['email'], 'password':self.mock_user['password']}
        response = self.client.post(self.LoginSubmitView_url, data, format='json')
        self.assertIs(response.status_code, status.HTTP_202_ACCEPTED, "Wrong response status..")
        self.assertIn("refresh", response.data.keys(), "Missing refresh token..")
        self.assertIn("access", response.data.keys(), "Missing access token..")

    def test_LoginSubmitView_correct_email_password_invalidated_account(self):
        data = {'email':"hello", 'password':"world"}
        response = self.client.post(self.LoginSubmitView_url, data, format='json')
        self.assertIs(response.status_code, status.HTTP_401_UNAUTHORIZED, "Wrong response status..")
        
    def test_ValidationCheckView_validated_account(self):
        register_response = self.client.post(self.RegisterSubmitView_url, self.mock_user, format='json')
        self.assertIs(register_response.status_code, status.HTTP_201_CREATED, "Wrong response status..")
        access_token = register_response.data['access']

        user = User.objects.get(email=self.mock_user['email'])
        data = {'validation_code': user.validation_code}

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.post(self.RegisterConfirmView_url, data, format='json')
        self.assertIs(response.status_code, status.HTTP_202_ACCEPTED, "Wrong response status..")

        user = User.objects.get(email=self.mock_user['email'])
        self.assertIs(user.is_validated, True, "Wrong is_validated value..")

        response = self.client.get(self.ValidationCheckView_url, {}, format='json')
        self.assertIs(response.status_code, status.HTTP_200_OK, "Wrong response status..")
        self.assertIs(True, response.data['validation'], "Wrong result..")

        self.client.credentials()

    def test_ValidationCheckView_not_validated_account(self):
        register_response = self.client.post(self.RegisterSubmitView_url, self.mock_user, format='json')
        self.assertIs(register_response.status_code, status.HTTP_201_CREATED, "Wrong response status..")
        access_token = register_response.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        response = self.client.get(self.ValidationCheckView_url, {}, format='json')
        self.assertIs(response.status_code, status.HTTP_200_OK, "Wrong response status..")
        self.assertIs(False, response.data['validation'], "Wrong result..")

        self.client.credentials()

    def test_ValidationCheckView_incorrect_access_token(self):
        register_response = self.client.post(self.RegisterSubmitView_url, self.mock_user, format='json')
        self.assertIs(register_response.status_code, status.HTTP_201_CREATED, "Wrong response status..")
        access_token = register_response.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token+'fake'}')

        response = self.client.get(self.ValidationCheckView_url, {}, format='json')
        self.assertIs(response.status_code, status.HTTP_401_UNAUTHORIZED, "Wrong response status..")

        self.client.credentials()
        '''