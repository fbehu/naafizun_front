from rest_framework import serializers
from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'owner_name', 'phone', 'address', 'created_at', 'archived', 'updated_at'
        ]
