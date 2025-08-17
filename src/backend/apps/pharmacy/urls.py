from rest_framework.routers import DefaultRouter
from .views import (
    PharmacyViewSet, HospitalViewSet, TransactionViewSet,
    PharmacyProductReceiptViewSet, PharmacyProductReceiptCreateView,
    PharmacyDebtPaymentViewSet
)
from django.urls import path

router = DefaultRouter()

router.register(r'pharmacies', PharmacyViewSet, basename='pharmacies')
router.register(r'hospitals', HospitalViewSet, basename='hospitals')
router.register(r'transactions', TransactionViewSet, basename='transactions')
router.register(r'pharmacy-receipts', PharmacyProductReceiptViewSet, basename='pharmacy-receipts')
router.register(r'pharmacy-debt-payments', PharmacyDebtPaymentViewSet, basename='pharmacy-debt-payments')

urlpatterns = [
    path('pharmacy-product-receipts/', PharmacyProductReceiptCreateView.as_view(), name='pharmacy-product-receipt-create'),
]

urlpatterns += router.urls