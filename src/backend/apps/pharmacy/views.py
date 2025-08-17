from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from apps.common.pagination import StandardResultsSetPagination
from apps.products.models import ProductModel
from .models import (
    PharmacyModel, HospitalModel, TransactionModel,
    PharmacyProductReceiptModel, PharmacyDebtPaymentModel
)
from .serializers import (
    PharmacySerializer, HospitalSerializer, MedicineSerializer, 
    TransactionSerializer, TransactionCreateSerializer,
    PharmacyProductReceiptSerializer, PharmacyDebtPaymentSerializer
)
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()


class PharmacyViewSet(viewsets.ModelViewSet):
    serializer_class = PharmacySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # Show archived items based on query parameter
        show_archived = self.request.query_params.get('archived', 'false').lower() == 'true'
        queryset = PharmacyModel.objects.filter(owner=self.request.user)
        
        if show_archived:
            return queryset.filter(archived=True)
        else:
            return queryset.filter(archived=False)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['post'], url_path='archive')
    def archive_multiple(self, request):
        pharmacy_ids = request.data.get('ids', [])
        if not pharmacy_ids:
            return Response(
                {"detail": "No pharmacy IDs provided."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only archive user's pharmacies
        updated_count = PharmacyModel.objects.filter(
            id__in=pharmacy_ids,
            owner=request.user
        ).update(archived=True)
        
        return Response(
            {"detail": f"{updated_count} pharmacies have been archived."}, 
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='restore')
    def restore_multiple(self, request):
        pharmacy_ids = request.data.get('ids', [])
        if not pharmacy_ids:
            return Response(
                {"detail": "No pharmacy IDs provided."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only restore user's pharmacies
        updated_count = PharmacyModel.objects.filter(
            id__in=pharmacy_ids,
            owner=request.user
        ).update(archived=False)
        
        return Response(
            {"detail": f"{updated_count} pharmacies have been restored."}, 
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        pharmacy = self.get_object()
        transactions = TransactionModel.objects.filter(
            pharmacy=pharmacy,
            owner=request.user,
            archived=False
        ).select_related('medicine')
        
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        pharmacy = self.get_object()
        
        stats = TransactionModel.objects.filter(
            pharmacy=pharmacy,
            owner=request.user,
            archived=False
        ).aggregate(
            total_amount=Sum('total_price'),
            total_transactions=Count('id'),
            total_medicines=Sum('quantity_pills')
        )
        
        return Response({
            'total_amount': stats['total_amount'] or 0,
            'total_transactions': stats['total_transactions'] or 0,
            'total_medicines': stats['total_medicines'] or 0
        })

    @action(detail=True, methods=['POST'])
    def update_stock(self, request, pk=None):
        """
        Update stock quantities when medicines are sold
        """
        products = request.data.get('products', [])

        if not products:
            return Response(
                {'detail': 'Products are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            pharmacy = self.get_object()
        except PharmacyModel.DoesNotExist:
            return Response(
                {'detail': 'Pharmacy not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Get the latest receipt
        receipt = PharmacyProductReceiptModel.objects.filter(
            pharmacy=pharmacy
        ).order_by('-created_at').first()

        if not receipt:
            return Response(
                {'detail': 'No receipts found for this pharmacy'},
                status=status.HTTP_404_NOT_FOUND
            )

        # First validate all products
        updated_products = []
        errors = []
        receipt_products = receipt.products.copy()  # Make a copy to work with

        for sell_item in products:
            product_id = sell_item.get('product_id')
            sell_quantity = sell_item.get('quantity', 0)
            product_found = False

            for product in receipt_products:
                if product['product_id'] == product_id:
                    product_found = True
                    current_count = product.get('count', 0)
                    
                    if current_count < sell_quantity:
                        errors.append(
                            f"Insufficient stock for product {product['name']}. "
                            f"Available: {current_count}, Requested: {sell_quantity}"
                        )
                    break

            if not product_found:
                errors.append(f"Product with ID {product_id} not found in receipt")

        # If there are any errors, return them all at once
        if errors:
            return Response(
                {'detail': errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # If validation passed, update all products
        for sell_item in products:
            product_id = sell_item.get('product_id')
            sell_quantity = sell_item.get('quantity', 0)

            for product in receipt_products:
                if product['product_id'] == product_id:
                    current_count = product.get('count', 0)
                    product['count'] = current_count - sell_quantity
                    updated_products.append(product)
                    break

        # Save the updated receipt with all changes
        receipt.products = receipt_products
        receipt.save()

        return Response({
            'detail': 'Stock updated successfully',
            'updated_products': updated_products
        })

    @action(detail=True, methods=['post'])
    def pay_debt(self, request, pk=None):
        try:
            pharmacy = self.get_object()
            amount = Decimal(str(request.data.get('amount', '0')))
            
            if amount <= 0:
                return Response(
                    {'success': False, 'error': 'Noto\'g\'ri summa'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                pharmacy.pay_debt(amount)
                # Save payment history
                PharmacyDebtPaymentModel.objects.create(
                    pharmacy=pharmacy,
                    amount=amount,
                    owner=request.user
                )
                return Response({
                    'success': True,
                    'remaining_debt': str(pharmacy.remaining_debt),
                    'message': f"To'lov muvaffaqiyatli amalga oshirildi. Qolgan qarz: {pharmacy.remaining_debt:,.2f} so'm"
                })
            except ValueError as e:
                return Response(
                    {'success': False, 'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class HospitalViewSet(viewsets.ModelViewSet):
    serializer_class = HospitalSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # Show archived items based on query parameter
        show_archived = self.request.query_params.get('archived', 'false').lower() == 'true'
        queryset = HospitalModel.objects.filter(owner=self.request.user)
        
        if show_archived:
            return queryset.filter(archived=True)
        else:
            return queryset.filter(archived=False)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a hospital"""
        hospital = self.get_object()
        hospital.archived = True
        hospital.save()
        return Response({'status': 'archived'})

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore a hospital from archive"""
        hospital = self.get_object()
        hospital.archived = False
        hospital.save()
        return Response({'status': 'restored'})




class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # Show archived items based on query parameter
        show_archived = self.request.query_params.get('archived', 'false').lower() == 'true'
        queryset = TransactionModel.objects.filter(owner=self.request.user)
        
        if show_archived:
            queryset = queryset.filter(archived=True)
        else:
            queryset = queryset.filter(archived=False)
        
        # Filter by pharmacy
        pharmacy_id = self.request.query_params.get('pharmacy_id', None)
        if pharmacy_id:
            queryset = queryset.filter(pharmacy_id=pharmacy_id)
        
        # Filter by transaction type
        transaction_type = self.request.query_params.get('type', None)
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        return queryset.select_related('medicine', 'pharmacy')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a transaction"""
        transaction = self.get_object()
        transaction.archived = True
        transaction.save()
        return Response({'status': 'archived'})

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore a transaction from archive"""
        transaction = self.get_object()
        transaction.archived = False
        transaction.save()
        return Response({'status': 'restored'})

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Bulk create transactions for multiple medicines"""
        serializer = TransactionCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            transactions = serializer.save()
            response_data = TransactionSerializer(transactions, many=True).data
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get transaction summary"""
        transactions = self.get_queryset()
        
        summary = transactions.aggregate(
            total_amount=Sum('total_price'),
            total_transactions=Count('id'),
            total_medicines=Sum('quantity_pills')
        )
        
        return Response({
            'total_amount': summary['total_amount'] or 0,
            'total_transactions': summary['total_transactions'] or 0,
            'total_medicines': summary['total_medicines'] or 0
        })

    @action(detail=False, methods=['get'])
    def archived(self, request):
        """Get archived transactions"""
        transactions = TransactionModel.objects.filter(
            owner=request.user,
            archived=True
        ).select_related('medicine', 'pharmacy')
        
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(transactions, many=True)
        return Response(serializer.data)



class PharmacyProductReceiptViewSet(viewsets.ModelViewSet):
    queryset = PharmacyProductReceiptModel.objects.all()
    serializer_class = PharmacyProductReceiptSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = PharmacyProductReceiptModel.objects.filter(owner=self.request.user)
        pharmacy_id = self.request.query_params.get('pharmacy')
        if pharmacy_id:
            queryset = queryset.filter(pharmacy_id=pharmacy_id)
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(owner=self.request.user)
        
        # Apteka qarzini yangilash
        pharmacy = instance.pharmacy
        total_purchase_amount = Decimal('0')
        
        # Qo'shilgan dorilar uchun umumий xarid summasini hisoblash
        for product in instance.products:
            count = product.get('count', 0)
            selling_price = Decimal(str(product.get('selling_price', '0')))
            total_purchase_amount += count * selling_price
        
        # Apteka qarzlarini yangilash
        pharmacy.total_debt += total_purchase_amount
        pharmacy.remaining_debt += total_purchase_amount
        pharmacy.save()
        
        return instance

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        pharmacy = instance.pharmacy
        # Use stored total_price if available; fallback to recompute from products
        amount = instance.total_price
        if amount is None or amount == 0:
            total = Decimal('0')
            for product in instance.products:
                count = product.get('count', 0)
                selling_price = Decimal(str(product.get('selling_price', '0')))
                total += count * selling_price
            amount = total
        # Update total_debt
        new_total_debt = pharmacy.total_debt - Decimal(str(amount))
        if new_total_debt < 0:
            new_total_debt = Decimal('0')
        # Recalculate remaining_debt as total_debt - sum(payments)
        from django.db.models import Sum
        payments_sum = PharmacyDebtPaymentModel.objects.filter(
            pharmacy=pharmacy,
            owner=request.user,
            archived=False
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        new_remaining = new_total_debt - payments_sum
        if new_remaining < 0:
            new_remaining = Decimal('0')
        pharmacy.total_debt = new_total_debt
        pharmacy.remaining_debt = new_remaining
        pharmacy.save()
        return super().destroy(request, *args, **kwargs)

class PharmacyDebtPaymentViewSet(viewsets.ModelViewSet):
    queryset = PharmacyDebtPaymentModel.objects.all()
    serializer_class = PharmacyDebtPaymentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = PharmacyDebtPaymentModel.objects.filter(owner=self.request.user, archived=False)
        pharmacy_id = self.request.query_params.get('pharmacy')
        if pharmacy_id:
            queryset = queryset.filter(pharmacy_id=pharmacy_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class PharmacyProductReceiptCreateView(APIView):
    def post(self, request):
        data = request.data
        pharmacy_id = data.get('pharmacy')
        products = data.get('products', [])
        total_price = data.get('total_price', 0)
        total_count = data.get('total_count', 0)
        owner = request.user

        try:
            pharmacy = PharmacyModel.objects.get(id=pharmacy_id)
            receipt = PharmacyProductReceiptModel.objects.create(
                pharmacy=pharmacy,
                products=products,
                total_price=total_price,
                total_count=total_count,
                owner=owner
            )
            return Response({'success': True, 'id': receipt.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)