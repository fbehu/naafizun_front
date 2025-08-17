from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessageViewSet, MessageListView

router = DefaultRouter()
router.register(r'', MessageViewSet, basename='messages')

urlpatterns = [
    path('', include(router.urls)), 
    path('apps/user_message/', MessageListView.as_view(), name='message-list'), 
    path('apps/user_message/<int:pk>/', MessageListView.as_view(), name='message-detail'), 
]
