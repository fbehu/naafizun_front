from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import ProductSerializer
from .models import ProductModel
from apps.common.pagination import StandardResultsSetPagination
from decimal import Decimal


class ProductViewSet(viewsets.ModelViewSet):
    queryset = ProductModel.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # Show archived items based on query parameter
        show_archived = self.request.query_params.get('archived', 'false').lower() == 'true'
        queryset = ProductModel.objects.filter(owner=self.request.user)
        
        if show_archived:
            return queryset.filter(archived=True)
        else:
            return queryset.filter(archived=False)
        
        
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def minus_stock(self, request, pk=None):
        """
        Skladdan dori sonini kamaytirish (pachka va dona hisoblab).
        request.data: { "count": int }  # count is total pills to minus
        """
        try:
            product = self.get_object()
            pills_per_package = getattr(product, 'pills_per_package', 1)
            stock_quantity = getattr(product, 'stock_quantity', 0)
            product_type = getattr(product, 'type', None)

            count = int(request.data.get('count', 0))  # total pills to minus

            if count <= 0:
                return Response({'success': False, 'error': 'Minus soni noto\'g\'ri'}, status=status.HTTP_400_BAD_REQUEST)

            if product_type == 'dona':
                # Directly minus count from stock_quantity
                if count > stock_quantity:
                    return Response({'success': False, 'error': 'Yetarli dona yo\'q'}, status=status.HTTP_400_BAD_REQUEST)
                product.stock_quantity -= count
                product.save()
                return Response({'success': True, 'new_stock_quantity': product.stock_quantity}, status=status.HTTP_200_OK)
            elif product_type == 'pachka':
                # Allow mixed subtraction: packages and single pills
                total_pills_available = stock_quantity * pills_per_package + getattr(product, 'loose_pills', 0)

                if count > total_pills_available:
                    return Response({'success': False, 'error': 'Yetarli dori yo\'q'}, status=status.HTTP_400_BAD_REQUEST)

                new_total = total_pills_available - count
                new_packages = new_total // pills_per_package
                new_loose = new_total % pills_per_package

                # Save back packages and loose pills
                product.stock_quantity = int(new_packages)
                if hasattr(product, 'loose_pills'):
                    product.loose_pills = int(new_loose)
                product.save()

                return Response({
                    'success': True,
                    'new_stock_quantity': product.stock_quantity,  # packages
                    'remaining_loose_pills': getattr(product, 'loose_pills', 0),
                    'remaining_total_pills': new_total,
                    'deducted_packages': count // pills_per_package,
                    'deducted_loose_pills': count % pills_per_package,
                }, status=status.HTTP_200_OK)
            else:
                return Response({'success': False, 'error': 'Mahsulot turi noto\'g\'ri'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_stock(self, request, pk=None):
        """
        Skladga dori sonini qo'shish (pachka va dona hisoblab).
        request.data: { "count": int }  # count is total pills to add
        """
        try:
            product = self.get_object()
            pills_per_package = getattr(product, 'pills_per_package', 1)
            stock_quantity = getattr(product, 'stock_quantity', 0)
            product_type = getattr(product, 'type', None)

            count = int(request.data.get('count', 0))  # total pills to add

            if count <= 0:
                return Response(
                    {'success': False, 'error': 'Qo\'shiladigan son noto\'g\'ri'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            if product_type == 'dona':
                # Directly add count to stock_quantity
                product.stock_quantity += count
                product.save()
                return Response(
                    {'success': True, 'new_stock_quantity': product.stock_quantity}, 
                    status=status.HTTP_200_OK
                )
            elif product_type == 'pachka':
                # Allow mixed addition: packages and single pills
                total_pills_available = stock_quantity * pills_per_package + getattr(product, 'loose_pills', 0)

                new_total = total_pills_available + count
                new_packages = new_total // pills_per_package
                new_loose = new_total % pills_per_package

                product.stock_quantity = int(new_packages)
                if hasattr(product, 'loose_pills'):
                    product.loose_pills = int(new_loose)
                product.save()
                return Response(
                    {
                        'success': True,
                        'new_stock_quantity': product.stock_quantity,  # packages
                        'remaining_loose_pills': getattr(product, 'loose_pills', 0),
                        'remaining_total_pills': new_total,
                        'added_packages': count // pills_per_package,
                        'added_loose_pills': count % pills_per_package,
                    }, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'success': False, 'error': 'Mahsulot turi noto\'g\'ri'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def pay_debt(self, request, pk=None):
        try:
            product = self.get_object()
            
            if not product.total_purchase_amount or not product.remaining_debt:
                return Response({'success': False, 'error': 'Qarz mavjud emas'}, 
                              status=status.HTTP_400_BAD_REQUEST)
                
            amount = Decimal(str(request.data.get('amount', '0')))
            if amount <= 0:
                return Response({'success': False, 'error': 'Noto\'g\'ri summa'}, 
                              status=status.HTTP_400_BAD_REQUEST)
                
            if amount > product.remaining_debt:
                return Response({'success': False, 'error': 'To\'lov summasi qarzdan ko\'p'}, 
                              status=status.HTTP_400_BAD_REQUEST)
                
            product.remaining_debt -= amount
            product.save()
            
            return Response({
                'success': True,
                'initial_debt': str(product.total_purchase_amount),
                'remaining_debt': str(product.remaining_debt),
                'message': f"To'lov muvaffaqiyatli amalga oshirildi. Boshlang'ich qarz: {product.total_purchase_amount:,.2f} so'm, Qolgan qarz: {product.remaining_debt:,.2f} so'm"
            })
            
        except (ValueError, TypeError) as e:
            return Response({'success': False, 'error': 'Noto\'g\'ri summa formati'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, 
                          status=status.HTTP_400_BAD_REQUEST)