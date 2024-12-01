from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterSubmitAPIView, LoginSubmitAPIView, RegisterConfirmAPIView, ValidationCheckAPIView

urlpatterns = [
    path('register/submit', RegisterSubmitAPIView.as_view(), name="register/submit"),
    path('register/confirm', RegisterConfirmAPIView.as_view(), name="register/confirm"),
    path('login/submit', LoginSubmitAPIView.as_view(), name='login/submit'),
    path('validation/check', ValidationCheckAPIView.as_view(), name="validation/check"),
    path('token/refresh', TokenRefreshView.as_view()),
]