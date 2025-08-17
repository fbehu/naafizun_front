from rest_framework import serializers
from .models import DoctorModel

class DoctorSerializer(serializers.ModelSerializer):
    total_amount = serializers.SerializerMethodField()
    debt_amount = serializers.SerializerMethodField()

    class Meta:
        model = DoctorModel
        fields = ['id', 'polyclinic', 'name', 'specialty', 'phone', 'is_active', 'products', 'pharmacy', 'archived', 'created_at', 'total_amount', 'debt_amount']

    def get_total_amount(self, obj: DoctorModel):
        total = 0
        try:
            for p in obj.products or []:
                price = 0
                count = 0
                if isinstance(p, dict):
                    price = float(p.get('selling_price') or 0)
                    count = float(p.get('count') or 0)
                    item_total = p.get('total')
                    if item_total is not None:
                        total += float(item_total) or 0
                    else:
                        total += price * count
        except Exception:
            pass
        return round(total, 2)

    def get_debt_amount(self, obj: DoctorModel):
        debt = 0
        try:
            for p in obj.products or []:
                if isinstance(p, dict):
                    # Prefer explicit debt field if provided
                    if 'debt' in p:
                        debt += float(p.get('debt') or 0)
                        continue
                    # Otherwise attempt total - paid if paid present
                    total = p.get('total')
                    if total is None:
                        price = float(p.get('selling_price') or 0)
                        count = float(p.get('count') or 0)
                        total = price * count
                    paid = float(p.get('paid') or 0)
                    residual = float(total) - paid
                    if residual > 0:
                        debt += residual
        except Exception:
            pass
        return round(debt, 2)
