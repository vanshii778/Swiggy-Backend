from django.core.cache import cache
from django.conf import settings
from rest_framework import serializers
import re
from datetime import timedelta

def check_rate_limit(request, key_prefix, limit=5, window=60):
    """
    Check if the request should be rate limited.
    
    Args:
        request: The request object
        key_prefix: Prefix for the cache key
        limit: Maximum number of attempts allowed in the time window
        window: Time window in seconds
        
    Returns:
        bool: True if rate limited, False otherwise
    """
    if not settings.DEBUG:  # Skip rate limiting in development
        ip = request.META.get('REMOTE_ADDR')
        cache_key = f'{key_prefix}_{ip}'
        
        # Get current count
        current = cache.get(cache_key, 0)
        
        if current >= limit:
            return True
            
        # Increment the count
        cache.set(cache_key, current + 1, timeout=window)
    return False

def validate_password_strength(password):
    """
    Validate password strength.
    
    Password must be at least 8 characters long and contain:
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 digit
    - At least 1 special character
    """
    if len(password) < 8:
        raise serializers.ValidationError("Password must be at least 8 characters long.")
    
    if not re.search(r'[A-Z]', password):
        raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        
    if not re.search(r'[a-z]', password):
        raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        
    if not re.search(r'\d', password):
        raise serializers.ValidationError("Password must contain at least one digit.")
        
    if not re.search(r'[^A-Za-z0-9]', password):
        raise serializers.ValidationError("Password must contain at least one special character.")
    
    return True

class RateLimitMixin:
    """
    Mixin to add rate limiting to API views.
    Usage:
        class MyView(RateLimitMixin, APIView):
            rate_limit_key = 'my_view'
            rate_limit = 5  # requests
            rate_window = 60  # seconds
    """
    rate_limit_key = None
    rate_limit = 5
    rate_window = 60
    
    def check_rate_limit(self, request):
        if not self.rate_limit_key:
            raise NotImplementedError("rate_limit_key must be set")
            
        if check_rate_limit(
            request, 
            key_prefix=f'rl_{self.rate_limit_key}',
            limit=self.rate_limit,
            window=self.rate_window
        ):
            raise serializers.ValidationError({
                'detail': f'Too many requests. Please try again in {self.rate_window} seconds.'
            }, code='too_many_requests')
