from django.conf import settings
from django.db import models

from apps.common.models import BaseModel


class NoteModel(BaseModel):
    """User note with optional schedule and recurrence."""

    class Recurrence(models.TextChoices):
        DAILY = 'daily', 'Daily'
        WEEKLY = 'weekly', 'Weekly'
        MONTHLY = 'monthly', 'Monthly'

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notes',
        verbose_name='Владелец',
    )

    title = models.CharField(max_length=255, verbose_name='Sarlavha')
    content = models.TextField(blank=True, verbose_name='Matn')

    # Optional schedule
    scheduled_at = models.DateTimeField(null=True, blank=True, verbose_name='Rejalashtirilgan vaqt')
    recurrence = models.CharField(
        max_length=16,
        choices=Recurrence.choices,
        null=True,
        blank=True,
        verbose_name='Davriylik'
    )

    archived = models.BooleanField(default=False, verbose_name='Архивировано')

    class Meta:
        verbose_name = 'Eslatma'
        verbose_name_plural = 'Eslatmalar'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"{self.title} ({self.owner_id})"