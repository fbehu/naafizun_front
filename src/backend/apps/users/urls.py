from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import RegisterView, LogoutView, LoginView, UserModelViewSet

router = DefaultRouter()
router.register(r'', UserModelViewSet)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
]

urlpatterns += router.urls