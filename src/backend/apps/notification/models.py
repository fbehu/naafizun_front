from django.db import models
from django.conf import settings

class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)  # Add this
    message = models.TextField()
    scheduled_time = models.DateTimeField(null=True, blank=True) 
    is_completed = models.BooleanField(default=False)  # Add this
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification({self.user}, {self.title}: {self.message[:20]})"
