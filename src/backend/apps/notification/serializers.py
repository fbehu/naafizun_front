from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id',
            'user',
            'title',
            'message',
            'is_completed',
            'scheduled_time',
            'created_at',
            'read',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'read']
