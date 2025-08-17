from rest_framework import serializers
from .models import (
    PharmacyModel, HospitalModel, TransactionModel,
    PharmacyProductReceiptModel, PharmacyDebtPaymentModel
)
from apps.products.models import ProductModel
from django.views.decorators.http import require_GET

class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductModel
        fields = '__all__'
        read_only_fields = ['owner']

class PharmacySerializer(serializers.ModelSerializer):
    class Meta:
        model = PharmacyModel
        fields = ['id', 'name', 'address', 'phone', 'manager', 'archived', 'total_debt', 'remaining_debt', 'created_at', 'updated_at']
        read_only_fields = ['owner']


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = HospitalModel
        fields = ['id', 'name', 'address',  'manager', 'archived', 'created_at', 'updated_at']
        read_only_fields = ['owner']


class TransactionSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    medicine_dosage = serializers.CharField(source='medicine.dosage', read_only=True)
    pharmacy_name = serializers.CharField(source='pharmacy.name', read_only=True)
    total_pills = serializers.SerializerMethodField()

    class Meta:
        model = TransactionModel
        fields = [
            'id', 'pharmacy', 'medicine', 'quantity_pills', 'quantity_packages',
            'price_per_unit', 'total_price', 'transaction_type', 'archived',
            'medicine_name', 'medicine_dosage', 'pharmacy_name', 'total_pills',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['owner', 'total_price']

    def get_total_pills(self, obj):
        return obj.quantity_pills * obj.quantity_packages

    def create(self, validated_data):
        # Calculate total price automatically
        quantity_pills = validated_data.get('quantity_pills', 0)
        quantity_packages = validated_data.get('quantity_packages', 0)
        price_per_unit = validated_data.get('price_per_unit', 0)
        
        total_pills = quantity_pills * quantity_packages
        total_price = total_pills * price_per_unit
        
        validated_data['total_price'] = total_price
        validated_data['owner'] = self.context['request'].user
        
        return super().create(validated_data)


class TransactionCreateSerializer(serializers.Serializer):
    pharmacy_id = serializers.IntegerField()
    medicines = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )

    def validate_medicines(self, value):
        for medicine_data in value:
            required_fields = ['medicine_id', 'quantity_pills', 'quantity_packages']
            for field in required_fields:
                if field not in medicine_data:
                    raise serializers.ValidationError(f"Поле '{field}' обязательно для каждого лекарства")
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        pharmacy_id = validated_data['pharmacy_id']
        medicines_data = validated_data['medicines']
        
        try:
            pharmacy = PharmacyModel.objects.get(id=pharmacy_id, owner=user, archived=False)
        except PharmacyModel.DoesNotExist:
            raise serializers.ValidationError("Аптека не найдена")
        
        transactions = []
        for medicine_data in medicines_data:
            try:
                medicine = ProductModel.objects.get(
                    id=medicine_data['medicine_id'], 
                    owner=user, 
                    archived=False
                )
            except ProductModel.DoesNotExist:
                continue
            
            quantity_pills = int(medicine_data['quantity_pills'])
            quantity_packages = int(medicine_data['quantity_packages'])
            
            # Calculate price based on medicine price type
            price_per_unit = medicine.get_price_per_pill()
            
            total_pills = quantity_pills * quantity_packages
            total_price = total_pills * price_per_unit
            
            transaction = TransactionModel.objects.create(
                pharmacy=pharmacy,
                medicine=medicine,
                quantity_pills=quantity_pills,
                quantity_packages=quantity_packages,
                price_per_unit=price_per_unit,
                total_price=total_price,
                transaction_type='sale',
                owner=user
            )
            transactions.append(transaction)
        
        return transactions


class PharmacyProductReceiptProductSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    name = serializers.CharField()
    dosage = serializers.CharField(default='')
    composition = serializers.CharField(default='')
    manufacturer = serializers.CharField(default='')
    selling_price = serializers.FloatField(default=0)
    count = serializers.IntegerField()
    total = serializers.FloatField()
    total_product = serializers.IntegerField(default=0)


class PharmacyProductReceiptSerializer(serializers.ModelSerializer):
    products = PharmacyProductReceiptProductSerializer(many=True)

    class Meta:
        model = PharmacyProductReceiptModel
        fields = ['id', 'pharmacy', 'products', 'total_price', 'total_count', 'created_at', 'updated_at']
        read_only_fields = ['owner', 'created_at', 'updated_at']


class PharmacyDebtPaymentSerializer(serializers.ModelSerializer):
    pharmacy_name = serializers.CharField(source='pharmacy.name', read_only=True)

    class Meta:
        model = PharmacyDebtPaymentModel
        fields = ['id', 'pharmacy', 'pharmacy_name', 'amount', 'archived', 'created_at', 'updated_at']
        read_only_fields = ['owner', 'created_at', 'updated_at']
