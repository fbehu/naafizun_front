from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone
from apps.notification.models import Notification
from asgiref.sync import sync_to_async

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close()
        else:
            self.group_name = f"user_{self.scope['user'].id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            await self.send_scheduled_notifications()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        # Mark notification as read when frontend requests
        if content.get("action") == "mark_read" and content.get("id"):
            await self.mark_as_read(content["id"])
            await self.send_json({"action": "read", "id": content["id"]})

    async def send_notification(self, event):
        await self.send_json(event["notification"])

    async def send_scheduled_notifications(self):
        # Send all notifications where scheduled_time <= now and not completed/read
        user = self.scope["user"]
        now = timezone.now()
        notifications = await sync_to_async(list)(
            Notification.objects.filter(
                user=user,
                scheduled_time__lte=now,
                is_completed=False,
                read=False
            )
        )
        for notif in notifications:
            await self.send_json({
                "notification": {
                    "id": notif.id,
                    "title": notif.title,
                    "message": notif.message,
                    "scheduled_time": notif.scheduled_time.isoformat(),
                    "is_completed": notif.is_completed,
                    "created_at": notif.created_at.isoformat(),
                    "read": notif.read,
                }
            })

    async def mark_as_read(self, notif_id):
        await sync_to_async(Notification.objects.filter(id=notif_id).update)(read=True)
