from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from .models import User
from .serializers import (
    RegisterSerializer, LoginSerializer, ProfileSerializer,
    OTPSerializer, PasswordResetSerializer, PasswordChangeSerializer
)
import random
import logging

logger = logging.getLogger(__name__)

# Register (with email/phone, password, OTP/email verification)
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create user (not verified initially)
        user = serializer.save(is_verified=False)
        
        # Generate and send OTP
        otp = str(random.randint(100000, 999999))
        user.otp = otp
        user.save()
        
        # Send OTP via email
        try:
            send_mail(
                'Swiggy - Verify Your Email',
                f'Your verification code is: {otp}\n\nPlease enter this code to complete your registration.',
                'noreply@swiggy.com',
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Email send failed: {e}")
        
        return Response({
            'message': 'Registration successful! Please check your email for OTP verification.',
            'email': user.email,
            'otp_sent': True
        }, status=status.HTTP_201_CREATED)

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
                return Response({
                    'message': 'Email verified successfully! You can now login.',
                    'verified': True,
                    'user': {
                        'name': user.first_name,
                        'email': user.email
                    }
                })
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

# Logout with token blacklisting
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            # Blacklist all tokens for this user
            tokens = OutstandingToken.objects.filter(user_id=request.user.id)
            for token in tokens:
                try:
                    BlacklistedToken.objects.get_or_create(token=token)
                except:
                    pass
                    
            logger.info(f"User {request.user.email} logged out successfully")
            return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Logout error for user {request.user.email}: {str(e)}")
            return Response({'detail': 'Logout successful.'}, status=status.HTTP_200_OK)

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

# Admin Dashboard - User Management
class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]
    
    def get(self, request):
        total_users = User.objects.count()
        verified_users = User.objects.filter(is_verified=True).count()
        unverified_users = User.objects.filter(is_verified=False).count()
        admin_users = User.objects.filter(role='admin').count()
        
        recent_users = User.objects.order_by('-date_joined')[:10]
        
        return Response({
            'stats': {
                'total_users': total_users,
                'verified_users': verified_users,
                'unverified_users': unverified_users,
                'admin_users': admin_users,
            },
            'recent_users': [
                {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'is_verified': user.is_verified,
                    'role': user.role,
                    'date_joined': user.date_joined,
                }
                for user in recent_users
            ]
        })

# Admin - List All Users
class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = ProfileSerializer
    queryset = User.objects.all()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role', None)
        is_verified = self.request.query_params.get('is_verified', None)
        
        if role:
            queryset = queryset.filter(role=role)
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == 'true')
            
        return queryset.order_by('-date_joined')

# Admin - Manage User (Update/Delete)
class AdminUserManageView(APIView):
    permission_classes = [IsAdmin]
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            serializer = ProfileSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
    
    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            
            # Admin can update user role, verification status, etc.
            role = request.data.get('role')
            is_verified = request.data.get('is_verified')
            is_active = request.data.get('is_active')
            
            if role and role in ['user', 'admin']:
                user.role = role
            if is_verified is not None:
                user.is_verified = bool(is_verified)
            if is_active is not None:
                user.is_active = bool(is_active)
                
            user.save()
            
            logger.info(f"Admin {request.user.email} updated user {user.email}")
            return Response({'detail': 'User updated successfully.'})
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
    
    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            if user.role == 'admin' and User.objects.filter(role='admin').count() <= 1:
                return Response({'detail': 'Cannot delete the last admin user.'}, status=400)
                
            user_email = user.email
            user.delete()
            
            logger.info(f"Admin {request.user.email} deleted user {user_email}")
            return Response({'detail': 'User deleted successfully.'})
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

# User Activity Log (for admin monitoring)
class UserActivityView(APIView):
    permission_classes = [IsAdmin]
    
    def get(self, request):
        # This would typically involve a separate Activity model
        # For now, returning basic user login data
        recent_logins = User.objects.filter(
            last_login__isnull=False
        ).order_by('-last_login')[:20]
        
        return Response([
            {
                'user_id': user.id,
                'email': user.email,
                'last_login': user.last_login,
                'is_active': user.is_active,
                'role': user.role,
            }
            for user in recent_logins
        ])
