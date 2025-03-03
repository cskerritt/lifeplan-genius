from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from lifecare.models import Evaluee, LifeCarePlan, CarePlanEntry, GeographicFactor, CPTCode
from .serializers import (
    UserSerializer, EvalueeSerializer, LifeCarePlanSerializer,
    CarePlanEntrySerializer, GeographicFactorSerializer, CPTCodeSerializer
)
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect
import json
from decimal import Decimal
import uuid
from rest_framework_simplejwt.tokens import AccessToken

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Register a new user.
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not username or not email or not password:
        return Response(
            {'error': 'Username, email, and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )
    
    return Response(
        {'success': 'User registered successfully'},
        status=status.HTTP_201_CREATED
    )

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class EvalueeViewSet(viewsets.ModelViewSet):
    serializer_class = EvalueeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only show evaluees for the current user's plans
        user_plans = LifeCarePlan.objects.filter(user=self.request.user)
        return Evaluee.objects.filter(lifecareplan__in=user_plans).distinct()

class LifeCarePlanViewSet(viewsets.ModelViewSet):
    serializer_class = LifeCarePlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name']
    ordering_fields = ['created_at', 'updated_at', 'first_name', 'last_name']
    
    def get_queryset(self):
        # Only show plans for the current user
        return LifeCarePlan.objects.filter(user=self.request.user)
    
    def list(self, request, *args, **kwargs):
        # Check if this is a form submission with a token
        token = request.POST.get('token')
        if token:
            # Create a simple HTML page that will store the token and redirect
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Redirecting...</title>
                <script>
                    // Store the token in localStorage
                    localStorage.setItem('access_token', '{token}');
                    
                    // Add token to all future fetch requests
                    const originalFetch = window.fetch;
                    window.fetch = function(url, options) {{
                        options = options || {{}};
                        options.headers = options.headers || {{}};
                        options.headers['Authorization'] = `Bearer ${{localStorage.getItem('access_token')}}`;
                        return originalFetch(url, options);
                    }};
                    
                    // Redirect to the plans page
                    window.location.href = '/api/plans/';
                </script>
            </head>
            <body>
                <p>Redirecting to Life Care Plans...</p>
            </body>
            </html>
            """
            return HttpResponse(html)
        
        # Normal API request
        return super().list(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def export_word(self, request, pk=None):
        plan = self.get_object()
        
        # This would be implemented with python-docx
        # For now, return a placeholder response
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = f'attachment; filename=LifeCarePlan_{plan.last_name}.docx'
        
        # Placeholder for actual document generation
        response.write(b'Word document placeholder')
        
        return response
    
    @action(detail=True, methods=['get'])
    def export_excel(self, request, pk=None):
        plan = self.get_object()
        
        # This would be implemented with openpyxl
        # For now, return a placeholder response
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename=LifeCarePlan_{plan.last_name}.xlsx'
        
        # Placeholder for actual document generation
        response.write(b'Excel document placeholder')
        
        return response

class CarePlanEntryViewSet(viewsets.ModelViewSet):
    serializer_class = CarePlanEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Filter entries by plan if plan_id is provided
        plan_id = self.request.query_params.get('plan_id')
        if plan_id:
            return CarePlanEntry.objects.filter(plan_id=plan_id)
        
        # Otherwise, only show entries for the current user's plans
        return CarePlanEntry.objects.filter(plan__user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def calculate_costs(self, request):
        # Extract parameters from request
        params = request.data
        
        try:
            # This would call the actual cost calculation logic
            # For now, return a placeholder response
            result = {
                'annual': Decimal('1000.00'),
                'lifetime': Decimal('10000.00'),
                'low': Decimal('8000.00'),
                'high': Decimal('12000.00'),
                'average': Decimal('10000.00'),
                'isOneTime': False
            }
            
            return Response(result)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class GeographicFactorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GeographicFactor.objects.all()
    serializer_class = GeographicFactorSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        zip_code = request.query_params.get('zip')
        if not zip_code:
            return Response(
                {'error': 'ZIP code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        factors = GeographicFactor.objects.filter(zip=zip_code)
        if not factors.exists():
            return Response([])
        
        serializer = self.get_serializer(factors, many=True)
        return Response(serializer.data)

class CPTCodeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CPTCode.objects.all()
    serializer_class = CPTCodeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def validate(self, request):
        code = request.query_params.get('code')
        if not code:
            return Response(
                {'error': 'CPT code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cpt_code = CPTCode.objects.get(code=code)
            serializer = self.get_serializer(cpt_code)
            return Response(serializer.data)
        except CPTCode.DoesNotExist:
            return Response(
                {'error': 'CPT code not found'},
                status=status.HTTP_404_NOT_FOUND
            )
