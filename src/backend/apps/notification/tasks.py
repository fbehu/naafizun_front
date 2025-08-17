from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
from apps.notification.models import Notification

def send_due_notifications():
    now = timezone.now()
    due_notifications = Notification.objects.filter(
        scheduled_time__lte=now,
        is_completed=False,
        read=False
    )
    channel_layer = get_channel_layer()
    for notif in due_notifications:
        async_to_sync(channel_layer.group_send)(
            f"user_{notif.user_id}",
            {
                "type": "send_notification",
                "notification": {
                    "id": notif.id,
                    "title": notif.title,
                    "message": notif.message,
                    "scheduled_time": notif.scheduled_time.isoformat(),
                    "is_completed": notif.is_completed,
                    "created_at": notif.created_at.isoformat(),
                    "read": notif.read,
                }
            }
        )
        notif.is_completed = True
        notif.save()
