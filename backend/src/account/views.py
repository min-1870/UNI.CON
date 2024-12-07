from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
# from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .serializers import UserSerializer
from .models import User
# Create your views here.

def get_tokens_from_request(request):
    email, password = request.data['email'], request.data['password']
    user = User.objects.filter(email=email).first()

    # user = authenticate()

    if user is None:
        raise AuthenticationFailed("Please enter correct email or password..")
        
    elif not user.check_password(password):
        raise AuthenticationFailed("Please enter correct email or password..")

    refresh = RefreshToken.for_user(user)
    return {
        'user': user.id, #TODO fix the function & var name and update the API notes
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterSubmitAPIView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            
            return Response(get_tokens_from_request(request), status=status.HTTP_201_CREATED)

class RegisterConfirmAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        if not user.is_validated:
            if user.validation_code == request.data['validation_code']:
                user.is_validated = True
                user.save(update_fields=['is_validated'])
                return Response({
                    "detail":"Validation success"
                }, status=status.HTTP_202_ACCEPTED)
            else:
                raise AuthenticationFailed("Invalid OTP")
        else:
            raise AuthenticationFailed("Validated Account")

class LoginSubmitAPIView(APIView):
    def post(self, request):
        return Response(get_tokens_from_request(request), status=status.HTTP_202_ACCEPTED)

class ValidationCheckAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        if user.is_validated:
            return Response({"validation":True}, status=status.HTTP_200_OK)
        else:
            return Response({"validation":False}, status=status.HTTP_200_OK)