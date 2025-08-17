from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .models import Company
from .serializers import CompanySerializer


class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Show archived items based on query parameter
        show_archived = self.request.query_params.get('archived', 'false').lower() == 'true'
        queryset = Company.objects.all()

        if show_archived:
            return queryset.filter(archived=True)
        else:
            return queryset.filter(archived=False)

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['post'], url_path='archive')
    def archive_multiple(self, request):
        company_ids = request.data.get('ids', [])
        if not company_ids:
            return Response(
                {"detail": "No company IDs provided."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Faqat foydalanuvchining kompaniyalarini arxivlash
        updated_count = Company.objects.filter(
            id__in=company_ids, 
        ).update(archived=True)
        
        return Response(
            {"detail": f"{updated_count} companies have been archived."}, 
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='restore')
    def restore_multiple(self, request):
        company_ids = request.data.get('ids', [])
        if not company_ids:
            return Response(
                {"detail": "No company IDs provided."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Faqat foydalanuvchining kompaniyalarini qayta tiklash
        updated_count = Company.objects.filter(
            id__in=company_ids, 
        ).update(archived=False)
        
        return Response(
            {"detail": f"{updated_count} companies have been restored."}, 
            status=status.HTTP_200_OK
        )