from rest_framework import serializers
from .models import ProductModel, DebtModel


class DebtSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = DebtModel
        fields = ['id', 'initial_amount', 'remaining_amount', 'product', 'product_name']

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductModel
        fields = '__all__'
        read_only_fields = ['owner', 'total_purchase_amount', 'total_selling_amount', 'total_stock']
        
    def create(self, validated_data):
        purchase_price = validated_data.get('purchase_price', 0)
        selling_price = validated_data.get('selling_price', 0)
        stock_quantity = validated_data.get('stock_quantity', 0)
        pills_per_package = validated_data.get('pills_per_package', 1)
        product_type = validated_data.get('type', 'dona')
        loose_pills = validated_data.get('loose_pills', 0)
        
        # Calculate totals
        if purchase_price:
            total_purchase = purchase_price * (stock_quantity if product_type == 'dona' else stock_quantity)
            validated_data['total_purchase_amount'] = total_purchase
            validated_data['remaining_debt'] = total_purchase
            
        if selling_price:
            validated_data['total_selling_amount'] = selling_price * (stock_quantity if product_type == 'dona' else stock_quantity)
        
        # Total stock in pills
        total_stock = stock_quantity if product_type == 'dona' else (stock_quantity * pills_per_package + (loose_pills or 0))
        validated_data['total_stock'] = total_stock
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        purchase_price = validated_data.get('purchase_price', instance.purchase_price or 0)
        selling_price = validated_data.get('selling_price', instance.selling_price or 0)
        stock_quantity = validated_data.get('stock_quantity', instance.stock_quantity)
        pills_per_package = validated_data.get('pills_per_package', instance.pills_per_package)
        product_type = validated_data.get('type', instance.type)
        loose_pills = validated_data.get('loose_pills', getattr(instance, 'loose_pills', 0))
        
        if purchase_price:
            validated_data['total_purchase_amount'] = purchase_price * (stock_quantity if product_type == 'dona' else stock_quantity)
        if selling_price:
            validated_data['total_selling_amount'] = selling_price * (stock_quantity if product_type == 'dona' else stock_quantity)
        
        # Total stock in pills
        total_stock = stock_quantity if product_type == 'dona' else (stock_quantity * pills_per_package + (loose_pills or 0))
        validated_data['total_stock'] = total_stock
        
        return super().update(instance, validated_data)