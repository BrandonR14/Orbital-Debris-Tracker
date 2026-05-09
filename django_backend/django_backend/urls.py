"""
URL configuration for django_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import (
    SatelliteViewSet, TLEEntryViewSet, RiskReportViewSet, PredictionReportViewSet,
    register_view, login_view, logout_view, user_profile_view,
    trigger_prediction, get_prediction_status, prediction_history, satellite_tle_data,
)

router = DefaultRouter()
router.register(r'satellites', SatelliteViewSet)
router.register(r'tles', TLEEntryViewSet)
router.register(r'reports', RiskReportViewSet)
router.register(r'prediction-reports', PredictionReportViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/register/', register_view, name='register'),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/logout/', logout_view, name='logout'),
    path('api/auth/profile/', user_profile_view, name='profile'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/trigger-prediction/', trigger_prediction, name='trigger_prediction'),
    path('api/prediction-status/<str:task_id>/', get_prediction_status, name='prediction_status'),
    path('api/prediction-history/', prediction_history, name='prediction_history'),
    path('api/satellite-tle-data/', satellite_tle_data, name='satellite_tle_data'),
]
