from rest_framework import serializers
from auditlog.models import LogEntry

class LogEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LogEntry
        fields = ['id', 'actor', 'action', 'object_repr', 'changes', 'timestamp']
