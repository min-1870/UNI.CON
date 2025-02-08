from .permissions import User_IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets, status
from .serializers import UserSerializer
from rest_framework.decorators import action
from .utils import send_email, annotate_user
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.hashers import make_password
from .models import User
from .constants import OTP_EMAIL_BODY, OTP_EMAIL_SUBJECT, FORGOT_PASSWORD_EMAIL_BODY, FORGOT_PASSWORD_EMAIL_SUBJECT
from randomname import get_name

class UserViewSet(viewsets.ModelViewSet):

    permission_classes = [User_IsAuthenticated]
    serializer_class = UserSerializer

    @action(detail=False, methods=["post"])
    def login(self, request):
        email, password = request.data["email"], request.data["password"]
        user_instance = User.objects.filter(email=email).first()

        # Validate the email
        if user_instance is None:
            raise AuthenticationFailed("Please enter correct email or password..")

        # Validate the password
        elif not user_instance.check_password(password):
            raise AuthenticationFailed("Please enter correct email or password..")

        user_instance = annotate_user(user_instance)
        serializer = self.get_serializer(user_instance)

        # Send OTP again whe the validation is false
        if not user_instance.is_validated:
            send_email(OTP_EMAIL_SUBJECT, OTP_EMAIL_BODY+user_instance.validation_code, user_instance.email)
            return Response(serializer.data, status=status.HTTP_403_FORBIDDEN)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def validate(self, request):
        user_instance = request.user

        # Check the missing property
        if "validation_code" not in request.data.keys():
            return Response(
                {"detail": "The property is missing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for the empty property
        validation_code = request.data.get("validation_code", "").strip()
        if len(validation_code) == 0:
            return Response(
                {"detail": "The property is empty."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Validate the code in the DB
        if validation_code != user_instance.validation_code:
            return Response(
                {"detail": "The validation code is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update the necessary properties
        user_instance.is_validated = True
        user_instance.save(update_fields=["is_validated"])

        user_instance = annotate_user(user_instance)
        serializer = self.get_serializer(user_instance)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def newpassword(self, request):
        user_instance = request.user
        
        current_password, new_password =request.data["current_password"], request.data["new_password"]

        # Validate the password
        if not user_instance.check_password(current_password):
            return Response(
                {"detail": "The current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate the new password
        if new_password == current_password:
            return Response(
                {"detail": "The new password is the same as the old one."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        new_password = make_password(new_password)

        user_instance.password = new_password
        user_instance.save(update_fields=["password"])

        return Response({"detail":"The password has been updated."}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["post"])
    def forgotpassword(self, request):
        user_instance = request.user
        
        email = request.data["email"]
        user_instance = User.objects.filter(email=email).first()

        # Validate the email
        if user_instance is None:
            return Response(
                {"detail": "The email is not registered."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        temporary_password = get_name()
        send_email(FORGOT_PASSWORD_EMAIL_SUBJECT, FORGOT_PASSWORD_EMAIL_BODY+temporary_password, request.data["email"])

        user_instance.password = make_password(temporary_password)
        user_instance.save(update_fields=["password"])

        return Response({"detail":"The temporary password has been sent."}, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        return Response(
            {"detail": "This action is not allowed."}, status=status.HTTP_403_FORBIDDEN
        )

    def list(self, request, *args, **kwargs):
        return Response(
            {"detail": "This action is not allowed."}, status=status.HTTP_403_FORBIDDEN
        )

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "This action is not allowed."}, status=status.HTTP_403_FORBIDDEN
        )

    def partial_update(self, request, *args, **kwargs):
        return Response(
            {"detail": "This action is not allowed."}, status=status.HTTP_403_FORBIDDEN
        )
