from django.contrib.auth import get_user_model
from django.db import models
from apps.common.models import BaseModel
from auditlog.registry import auditlog

User = get_user_model()

STATUS_CHOICES = (
    ('active', 'Active'),
    ('inactive', 'Inactive'),
    ('deleted', 'Deleted'),
)


class DataModel(BaseModel):
    title = models.CharField(max_length=100)
    description = models.TextField()
    owner = models.ForeignKey(User, related_name='owner', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')

    class Meta:
        verbose_name_plural = "Data"
        verbose_name = "Data"

    def __str__(self):
        return self.title

auditlog.register(DataModel)