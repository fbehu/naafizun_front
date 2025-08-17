from django.contrib import admin

from .models import HospitalModel, PharmacyModel

admin.site.register(HospitalModel)
admin.site.register(PharmacyModel)