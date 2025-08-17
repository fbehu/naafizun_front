from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import DoctorModel
from .serializers import DoctorSerializer
from apps.pharmacy.models import HospitalModel

class DoctorViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Get user's polyclinic first
        user_polyclinic = HospitalModel.objects.filter(owner=self.request.user).first()
        if not user_polyclinic:
            return DoctorModel.objects.none()

        # Check if a specific polyclinic ID is provided in the query parameters
        polyclinic_id = self.request.query_params.get('polyclinic')
        if polyclinic_id:
            try:
                polyclinic_id = int(polyclinic_id)
                if polyclinic_id != user_polyclinic.id:
                    return DoctorModel.objects.none()
            except ValueError:
                return DoctorModel.objects.none()

        # Show archived items based on query parameter
        show_archived = self.request.query_params.get('archived', 'false').lower() == 'true'
        queryset = DoctorModel.objects.filter(polyclinic=user_polyclinic)
        
        if show_archived:
            return queryset.filter(archived=True)
        return queryset.filter(archived=False)

    def perform_create(self, serializer):
        user_polyclinic = HospitalModel.objects.filter(owner=self.request.user).first()
        if user_polyclinic:
            serializer.save(polyclinic=user_polyclinic)