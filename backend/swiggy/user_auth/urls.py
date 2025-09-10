from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', views.TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('verify-email/', views.OTPVerifyView.as_view(), name='verify_email'),
    path('resend-verification/', views.ResendVerificationView.as_view(), name='resend_verification'),
    
    # User Profile
    path('profile/', views.ProfileView.as_view(), name='user_profile'),
    path('password-reset/', views.PasswordResetView.as_view(), name='password_reset'),
    path('password-reset/verify/', views.PasswordResetVerifyView.as_view(), name='password_reset_verify'),
    path('password-change/', views.PasswordChangeView.as_view(), name='password_change'),
    
    # Admin Management
    path('admin/dashboard/', views.AdminDashboardView.as_view(), name='admin_dashboard'),
    path('admin/users/', views.AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/users/<int:user_id>/', views.AdminUserManageView.as_view(), name='admin_user_manage'),
    path('admin/activity/', views.UserActivityView.as_view(), name='user_activity'),
]
