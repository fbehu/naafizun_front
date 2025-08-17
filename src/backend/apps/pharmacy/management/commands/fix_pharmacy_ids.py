from django.core.management.base import BaseCommand
from apps.pharmacy.models import PharmacyModel
import uuid

class Command(BaseCommand):
    help = "Fix invalid UUIDs in PharmacyModel"

    def handle(self, *args, **kwargs):
        pharmacies = PharmacyModel.objects.all()
        for pharmacy in pharmacies:
            try:
                # Validate the UUID
                uuid.UUID(str(pharmacy.id))
            except ValueError:
                # Generate a new UUID if invalid
                pharmacy.id = uuid.uuid4()
                pharmacy.save()
                self.stdout.write(f"Fixed ID for pharmacy: {pharmacy.name}")
        self.stdout.write("All invalid UUIDs have been fixed.")
