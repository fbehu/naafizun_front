from rest_framework import generics
from auditlog.models import LogEntry
from .serializers import LogEntrySerializer

class LogEntryListAPIView(generics.ListAPIView):
    queryset = LogEntry.objects.all().order_by('-timestamp')
    serializer_class = LogEntrySerializer
