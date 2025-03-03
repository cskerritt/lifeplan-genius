from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserViewSet, EvalueeViewSet, LifeCarePlanViewSet,
    CarePlanEntryViewSet, GeographicFactorViewSet, CPTCodeViewSet,
    register_user
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'evaluees', EvalueeViewSet, basename='evaluee')
router.register(r'plans', LifeCarePlanViewSet, basename='lifecareplan')
router.register(r'entries', CarePlanEntryViewSet, basename='careplanentry')
router.register(r'geographic-factors', GeographicFactorViewSet)
router.register(r'cpt-codes', CPTCodeViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', register_user, name='register'),
]
