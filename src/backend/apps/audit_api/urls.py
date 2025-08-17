from django.urls import path
from .views import LogEntryListAPIView

urlpatterns = [
    path('', LogEntryListAPIView.as_view(), name='logentry-list'),
]
