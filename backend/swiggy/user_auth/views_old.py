from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.utils import timezone
from .models import User
from .serializers import (
    RegisterSerializer, LoginSerializer, ProfileSerializer,
    OTPSerializer, PasswordResetSerializer, PasswordChangeSerializer
)
import random

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    """
    Register a new user with email and password.
    """
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAll]

class OTPVerifyView(RateLimitMixin, APIView):
    """
    Verify OTP for email verification.
    """
    permission_classes = [permissions.AllowAny]
    rate_limit_key = 'verify_otp'
    rate_limit = 10  # 10 attempts per hour
    rate_window = 3600  # 1 hour
    
    def post(self, request):
        # Check rate limit
        self.check_rate_limit(request)
        
        serializer = OTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        
        try:
            user = User.objects.get(email=email)
            
            # Check if OTP exists and matches
            if not user.otp or user.otp != otp:
                return Response(
                    {'detail': 'Invalid OTP.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Check if OTP is expired (10 minutes)
            if (timezone.now() - user.otp_created_at).total_seconds() > 600:  # 10 minutes
                return Response(
                    {'detail': 'OTP has expired. Please request a new one.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark user as verified and clear OTP
            user.is_verified = True
            user.otp = None
            user.otp_created_at = None
            user.save()
            
            return Response({'detail': 'Email verified successfully.'})
            
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class LoginView(TokenObtainPairView):
    """
    Authenticate user and return JWT tokens.
    """
    serializer_class = CustomTokenObtainPairSerializer

class LogoutView(APIView):
    """
    Logout user by blacklisting the refresh token.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'detail': 'Refresh token is required.'}, 
                    status=400
                )
                
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Successfully logged out.'}, status=200)
            
        except Exception:
            return Response(
                {'detail': 'Invalid token.'}, 
                status=400
            )

class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update user profile.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

class ChangePasswordView(generics.UpdateAPIView):
    """
    Change user password.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # Check old password
            if not self.object.check_password(serializer.data.get('old_password')):
                return Response(
                    {'old_password': ['Wrong password.']}, 
                    status=400
                )
            
            # Set new password
            self.object.set_password(serializer.data.get('new_password'))
            self.object.save()
            return Response({'detail': 'Password updated successfully.'}, status=200)
        
        return Response(serializer.errors, status=400)

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
