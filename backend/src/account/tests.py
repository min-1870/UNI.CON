from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from .models import User
from .constants import (
    LOGIN_NAME,
    REGISTER_NAME,
    VALIDATE_NAME,
    MOCK_USER,
    USER_RESPONSE_KEYS,
)


def request(client, name, data={}):
    if name == LOGIN_NAME:
        return client.post(reverse(name), data, format="json")
    elif name == REGISTER_NAME:
        return client.post(reverse(name), data, format="json")
    elif name == VALIDATE_NAME:
        return client.post(reverse(name), data, format="json")


class AccountAppViewTest(APITestCase):
    fixtures = ["fixtures.json"]

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
        user_instance = User.objects.filter(pk=response.data["id"]).first()
        self.assertIsNotNone(user_instance)
        self.assertEqual(user_instance.email, MOCK_USER["email"])
        self.assertFalse(user_instance.is_validated)

    def test_register_with_used_email(self):
        response = request(self.client, REGISTER_NAME, MOCK_USER)
        response = request(self.client, REGISTER_NAME, MOCK_USER)

        # Validate status code
        self.assertIs(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate(self):
        response = request(self.client, REGISTER_NAME, MOCK_USER)
        user_instance = User.objects.get(pk=response.data["id"])
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        response = request(
            self.client,
            VALIDATE_NAME,
            {"validation_code": user_instance.validation_code},
        )

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
        user_instance = User.objects.get(pk=response.data["id"])
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        response = request(
            self.client,
            VALIDATE_NAME,
            {"validation_code": user_instance.validation_code},
        )
        self.client.credentials()

        response = request(self.client, LOGIN_NAME, MOCK_USER)

        # Validate status code
        self.assertIs(response.status_code, status.HTTP_200_OK)

        # Validate response structure
        keys = set(response.data.keys())
        self.assertSetEqual(keys, USER_RESPONSE_KEYS)
