from django.db import models
from apps.pharmacy.models import HospitalModel
import uuid  # Import uuid for generating UUIDs

class DoctorModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # Use UUID as primary key
    polyclinic = models.ForeignKey(HospitalModel, on_delete=models.CASCADE, related_name='doctors')
    name = models.CharField(max_length=255)
    specialty = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    products = models.JSONField(default=list, blank=True)
    pharmacy = models.JSONField(default=list, blank=True, verbose_name="Aptekalar ro'yxati")
    archived = models.BooleanField(default=False, verbose_name='Архивировано')

    def __str__(self):
        return f"{self.name} ({self.specialty})"
