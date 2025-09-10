from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from .models import User
from .serializers import (
    RegisterSerializer, LoginSerializer, ProfileSerializer,
    OTPSerializer, PasswordResetSerializer, PasswordChangeSerializer
)
import random

# Register (with email/phone, password, OTP/email verification)
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def perform_create(self, serializer):
        user = serializer.save(is_verified=False)
        otp = str(random.randint(100000, 999999))
        user.otp = otp
        user.save()
        send_mail(
            'Your OTP Code',
            f'Your OTP is {otp}',
            'noreply@swiggy.com',
            [user.email],
            fail_silently=True,
        )
        return user

# OTP/email verification
class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = OTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        try:
            user = User.objects.get(email=email)
            if user.otp == otp:
                user.is_verified = True
                user.otp = None
                user.save()
                return Response({'detail': 'OTP verified successfully.'})
            return Response({'detail': 'Invalid OTP.'}, status=400)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

# Login (JWT-based)
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        user = authenticate(email=email, password=password)
        if user and user.is_verified:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'role': user.role,
                'user': {
                    'id': user.id,
                    'name': user.first_name,
                    'email': user.email,
                    'phone': user.phone,
                }
            })
        return Response({'detail': 'Invalid credentials or not verified.'}, status=400)

# Logout (JWT logout is client-side)
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        return Response({'detail': 'Logged out.'})

# Refresh tokens
class TokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response({'detail': 'Refresh token required.'}, status=400)
        try:
            token = RefreshToken(refresh)
            return Response({'access': str(token.access_token)})
        except Exception:
            return Response({'detail': 'Invalid refresh token.'}, status=400)

# Resend OTP
class ResendOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email is required.'}, status=400)
        try:
            user = User.objects.get(email=email)
            if user.is_verified:
                return Response({'detail': 'User is already verified.'}, status=400)
            otp = str(random.randint(100000, 999999))
            user.otp = otp
            user.save()
            send_mail(
                'Your New OTP Code',
                f'Your new OTP is {otp}',
                'noreply@swiggy.com',
                [user.email],
                fail_silently=True,
            )
            return Response({'detail': 'New OTP sent successfully.'})
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

# Resend Verification
class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email is required.'}, status=400)
        try:
            user = User.objects.get(email=email)
            if user.is_verified:
                return Response({'detail': 'User already verified.'}, status=400)
            otp = str(random.randint(100000, 999999))
            user.otp = otp
            user.save()
            send_mail(
                'Your OTP Code',
                f'Your OTP is {otp}',
                'noreply@swiggy.com',
                [user.email],
                fail_silently=True,
            )
            return Response({'detail': 'Verification OTP resent.'})
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

# Update profile (name, email, phone, password, profile picture)
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

# Password reset (forgot/reset)
class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            otp = str(random.randint(100000, 999999))
            user.otp = otp
            user.save()
            send_mail(
                'Password Reset OTP',
                f'Your OTP is {otp}',
                'noreply@swiggy.com',
                [user.email],
                fail_silently=True,
            )
            return Response({'detail': 'OTP sent to email.'})
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

# Password change (after OTP verification)
class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']
        user = request.user
        if not user.check_password(old_password):
            return Response({'detail': 'Old password incorrect.'}, status=400)
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password changed.'})

# Password reset OTP verification and update password
class PasswordResetVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')
        if not email or not otp or not new_password:
            return Response({'detail': 'Missing fields.'}, status=400)
        try:
            user = User.objects.get(email=email)
            if user.otp == otp:
                user.set_password(new_password)
                user.otp = None
                user.save()
                return Response({'detail': 'Password reset successful.'})
            return Response({'detail': 'Invalid OTP.'}, status=400)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

# Roles & permissions (user, admin)
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'
