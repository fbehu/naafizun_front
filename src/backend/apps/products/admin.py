from django.contrib import admin
from .models import ProductModel

@admin.register(ProductModel)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'dosage', 'type', 'manufacturer', 'total_stock', 'purchase_price', 'selling_price')
    search_fields = ('name', 'dosage')
    list_filter = ('name', 'dosage')
    ordering = ('-id',)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if request.user.role == 'superadmin':
            return queryset
        return queryset.filter(user=request.user)
    

