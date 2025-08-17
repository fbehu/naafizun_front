from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import NoteModel
from .serializers import NoteSerializer


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title']
    filterset_fields = ['archived']
    ordering_fields = ['created_at', 'scheduled_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        return NoteModel.objects.filter(owner=user)
