from django.http import JsonResponse, HttpResponse
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.shortcuts import redirect

class AuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = JWTAuthentication()

    def __call__(self, request):
        # Skip authentication for public paths
        path = request.path_info
        if any(path.startswith(public_path) for public_path in settings.PUBLIC_PATHS):
            return self.get_response(request)

        # Try to get token from various sources
        token = self._get_token_from_request(request)
        
        if not token:
            # If it's an API request, return JSON response
            if request.path_info.startswith('/api/') and not request.path_info.startswith('/api/token/'):
                return JsonResponse(
                    {'error': 'Authentication required', 'detail': 'Please sign in to access this resource'},
                    status=401
                )
            # Otherwise redirect to login page
            return redirect('/')

        try:
            # Validate the token
            validated_token = self.jwt_auth.get_validated_token(token)
            user = self.jwt_auth.get_user(validated_token)
            
            # Set the user on the request
            request.user = user
        except (InvalidToken, TokenError) as e:
            # If it's an API request, return JSON response
            if request.path_info.startswith('/api/'):
                return JsonResponse(
                    {'error': 'Invalid token', 'detail': str(e)},
                    status=401
                )
            # Otherwise redirect to login page
            return redirect('/')

        return self.get_response(request)
    
    def _get_token_from_request(self, request):
        """
        Extract token from various sources in the request.
        """
        # 1. Check Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            return auth_header.split(' ')[1]
        
        # 2. Check POST data
        if request.method == 'POST' and 'token' in request.POST:
            return request.POST.get('token')
        
        # 3. Check GET parameters
        if 'token' in request.GET:
            return request.GET.get('token')
        
        # 4. Check cookies
        if 'access_token' in request.COOKIES:
            return request.COOKIES.get('access_token')
        
        return None 