
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)

class Address(models.Model):
    user = models.ForeignKey('User', related_name='addresses', on_delete=models.CASCADE)
    type = models.CharField(max_length=20, default='Home')
    street_address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.type}: {self.street_address}, {self.city}, {self.state} {self.zip_code}"

class User(AbstractUser):
    # Use email as the unique identifier instead of username
    username = None
    email = models.EmailField(unique=True)
    
    # Additional fields
    phone = models.CharField(max_length=15, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    otp = models.CharField(max_length=6, blank=True, null=True)
    role = models.CharField(max_length=20, choices=[('user', 'User'), ('admin', 'Admin')], default='user')
    
    # Use the custom manager
    objects = CustomUserManager()
    
    # Set email as the USERNAME_FIELD for authentication
    USERNAME_FIELD = 'email'
    # No additional required fields for createsuperuser command
    REQUIRED_FIELDS = []
    
    def __str__(self):
        return self.email
