"""
Custom throttling classes for API rate limiting and DDoS protection
"""
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle, SimpleRateThrottle


class AuthRateThrottle(SimpleRateThrottle):
    """
    Strict rate limiting for authentication endpoints
    Prevents brute force attacks - 5 attempts per minute
    """
    scope = "auth"

    def get_cache_key(self, request, view):
        # Use IP address for auth endpoints
        return self.get_ident(request)


class BurstRateThrottle(UserRateThrottle):
    """
    Short burst protection - prevents rapid-fire requests
    10 requests per minute
    """
    scope = 'burst'


class SustainedRateThrottle(UserRateThrottle):
    """
    Long-term rate limiting - prevents sustained attacks
    100 requests per hour
    """
    scope = 'sustained'


class CommentRateThrottle(UserRateThrottle):
    """
    Rate limiting for comments to prevent spam
    20 comments per hour
    """
    scope = 'comment'


class MessageRateThrottle(UserRateThrottle):
    """
    Rate limiting for messages to prevent spam
    50 messages per hour
    """
    scope = 'message'


class UploadRateThrottle(UserRateThrottle):
    """
    Rate limiting for file uploads
    10 uploads per hour
    """
    scope = 'upload'


class StrictAnonRateThrottle(AnonRateThrottle):
    """
    Very strict rate limiting for anonymous users
    20 requests per minute
    """
    scope = 'anon'
    
    def get_cache_key(self, request, view):
        """
        Use IP address for anonymous users
        """
        if request.user and request.user.is_authenticated:
            return None  # Don't apply to authenticated users
        
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request)
        }
