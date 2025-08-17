from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q
from .models import ProductModel, DebtModel
from apps.companies.models import Company
from .serializers import DebtSerializer, ProductSerializer
from decimal import Decimal

class DebtViewSet(viewsets.ModelViewSet):
    serializer_class = DebtSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DebtModel.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'])
    def company_debts(self, request):
        """Har bir kompaniya bo'yicha qarzlarni ko'rsatish"""
        company_debts = []
        
        # Har bir kompaniya uchun qarzlarni hisoblash
        companies = Company.objects.filter(archived=False)
        
        for company in companies:
            # Ushbu kompaniyaning mahsulotlari bo'yicha qarzlar
            products_with_debts = ProductModel.objects.filter(
                manufacturer=company.name,
                owner=request.user,
                archived=False
            ).exclude(remaining_debt__isnull=True).exclude(remaining_debt=0)
            
            total_debt = products_with_debts.aggregate(
                total=Sum('remaining_debt')
            )['total'] or Decimal('0')
            
            if total_debt > 0:
                products_data = []
                for product in products_with_debts:
                    products_data.append({
                        'id': product.id,
                        'name': product.name,
                        'remaining_debt': float(product.remaining_debt or 0),
                        'initial_debt': float(product.initial_debt or 0)
                    })
                
                company_debts.append({
                    'company': {
                        'id': str(company.id),
                        'name': company.name,
                        'owner_name': company.owner_name,
                        'phone': company.phone,
                        'address': company.address
                    },
                    'total_debt': float(total_debt),
                    'products': products_data
                })
        
        return Response(company_debts)

    @action(detail=False, methods=['post'])
    def pay_company_debt(self, request):
        """Kompaniya qarzini to'lash"""
        company_id = request.data.get('company_id')
        payment_amount = Decimal(str(request.data.get('payment_amount', 0)))
        
        if not company_id or payment_amount <= 0:
            return Response(
                {'error': 'Company ID va to\'lov miqdori kerak'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            return Response(
                {'error': 'Kompaniya topilmadi'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Kompaniyaning barcha qarzli mahsulotlarini olish
        products_with_debts = ProductModel.objects.filter(
            manufacturer=company.name,
            owner=request.user,
            archived=False,
            remaining_debt__gt=0
        ).order_by('created_at')  # Eski qarzlarni birinchi to'lash
        
        remaining_payment = payment_amount
        updated_products = []
        
        for product in products_with_debts:
            if remaining_payment <= 0:
                break
                
            current_debt = product.remaining_debt or Decimal('0')
            
            if current_debt > 0:
                if remaining_payment >= current_debt:
                    # To'liq to'lash
                    remaining_payment -= current_debt
                    product.remaining_debt = Decimal('0')
                else:
                    # Qisman to'lash
                    product.remaining_debt = current_debt - remaining_payment
                    remaining_payment = Decimal('0')
                
                product.save()
                updated_products.append({
                    'id': product.id,
                    'name': product.name,
                    'paid_amount': float(current_debt - (product.remaining_debt or 0)),
                    'remaining_debt': float(product.remaining_debt or 0)
                })
        
        return Response({
            'message': 'To\'lov muvaffaqiyatli amalga oshirildi',
            'company': company.name,
            'total_paid': float(payment_amount - remaining_payment),
            'remaining_payment': float(remaining_payment),
            'updated_products': updated_products
        })

    @action(detail=False, methods=['get'])
    def total_debt_summary(self, request):
        """Umumiy qarz xulosasi"""
        total_debt = ProductModel.objects.filter(
            owner=request.user,
            archived=False
        ).aggregate(
            total=Sum('remaining_debt')
        )['total'] or Decimal('0')
        
        companies_count = Company.objects.filter(
            archived=False,
            name__in=ProductModel.objects.filter(
                owner=request.user,
                archived=False,
                remaining_debt__gt=0
            ).values_list('manufacturer', flat=True)
        ).count()
        
        return Response({
            'total_debt': float(total_debt),
            'companies_with_debt': companies_count
        })