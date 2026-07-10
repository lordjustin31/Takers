"""
Custom middleware for security and performance
"""
import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse

logger = logging.getLogger('django.security')


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Add security headers to all responses
    """
    def process_response(self, request, response):
        # Prevent clickjacking
        response['X-Frame-Options'] = 'DENY'
        
        # Prevent MIME type sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Enable XSS protection
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Permissions policy
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # Content Security Policy
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]
        response['Content-Security-Policy'] = '; '.join(csp_directives)
        
        return response


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Log suspicious requests
    """
    SUSPICIOUS_PATTERNS = [
        '../',  # Path traversal
        '<script',  # XSS attempt
        'UNION SELECT',  # SQL injection
        'DROP TABLE',  # SQL injection
        '--',  # SQL comment
        'eval(',  # Code injection
        'exec(',  # Code injection
    ]
    
    def process_request(self, request):
        # Check for suspicious patterns in request
        suspicious = False
        request_data = str(request.GET) + str(request.POST) + str(request.body)
        
        for pattern in self.SUSPICIOUS_PATTERNS:
            if pattern.lower() in request_data.lower():
                suspicious = True
                logger.warning(
                    f'Suspicious request detected: {pattern} from {request.META.get("REMOTE_ADDR")} '
                    f'to {request.path}'
                )
        
        # Check for excessive request size
        if len(request.body) > 10 * 1024 * 1024:  # 10MB
            logger.warning(
                f'Large request detected: {len(request.body)} bytes from {request.META.get("REMOTE_ADDR")}'
            )
        
        return None


class RateLimitExceededMiddleware(MiddlewareMixin):
    """
    Custom response for rate limit exceeded
    """
    def process_exception(self, request, exception):
        from rest_framework.exceptions import Throttled
        
        if isinstance(exception, Throttled):
            return JsonResponse({
                'error': 'Rate limit exceeded',
                'detail': 'Too many requests. Please try again later.',
                'wait': exception.wait
            }, status=429)
        
        return None
