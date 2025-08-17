import uuid
from django.db import models


class Company(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # Use UUID as primary key
    name = models.CharField(max_length=255, unique=True)
    owner_name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=32, blank=True, null=True)
    address = models.CharField(max_length=512, blank=True, null=True)
    archived = models.BooleanField(default=False, verbose_name='Архивировано')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Kompaniya"
        verbose_name_plural = "Kompaniyalar"
        ordering = ["-id"]

    def __str__(self) -> str:
        return self.name
