from django.contrib.auth import get_user_model
from django.db import models
from apps.common.models import BaseModel
from auditlog.registry import auditlog
import uuid

User = get_user_model()

PRICE_TYPE_CHOICES = (
    ('package', 'За упаковку'),
    ('pill', 'За таблетку'),
)

TRANSACTION_TYPE_CHOICES = (
    ('given', 'Выдано в аптеку'),
    ('sold', 'Продано'),
    ('returned', 'Возврат'),
)


class HospitalModel(BaseModel):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    manager = models.CharField(max_length=255)
    owner = models.ForeignKey(User, related_name='owner_hospital', on_delete=models.CASCADE)
    archived = models.BooleanField(default=False, verbose_name='Архивировано')

    class Meta:
        verbose_name = 'Hospital'
        verbose_name_plural = 'Hospitals'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

auditlog.register(HospitalModel)

class PharmacyModel(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20)
    manager = models.CharField(max_length=255)
    owner = models.ForeignKey(User, related_name='owner_pharmacy', on_delete=models.CASCADE)
    archived = models.BooleanField(default=False, verbose_name='Архивировано')
    total_debt = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name='Общий долг')
    remaining_debt = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name='Остаток долга')

    class Meta:
        verbose_name = 'Pharmacy'
        verbose_name_plural = 'Pharmacies'
        ordering = ['-created_at']

    def __str__(self):
        return self.name
    
    def pay_debt(self, amount):
        """To'lov qilish metodi"""
        if amount > self.remaining_debt:
            raise ValueError("To'lov summasi qarzdan ko'p bo'lishi mumkin emas")
        self.remaining_debt -= amount
        self.save()

auditlog.register(PharmacyModel)

class MedicineModel(BaseModel):
    name = models.CharField(max_length=255, verbose_name='Название лекарства')
    dosage = models.CharField(max_length=50, verbose_name='Дозировка', blank=True, null=True)
    pills_per_package = models.IntegerField(verbose_name='Количество таблеток в упаковке')
    price_per_package = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Цена за упаковку')
    price_per_pill = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Цена за таблетку')
    price_type = models.CharField(max_length=10, choices=PRICE_TYPE_CHOICES, default='package', verbose_name='Тип цены')
    manufacturer = models.CharField(max_length=255, blank=True, null=True, verbose_name='Производитель')
    expiry_date = models.DateField(blank=True, null=True, verbose_name='Срок годности')
    stock_quantity = models.IntegerField(default=0, verbose_name='Количество на складе')
    sold_quantity = models.IntegerField(default=0, verbose_name='Проданное количество')
    given_quantity = models.IntegerField(default=0, verbose_name='Выданное количество')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Владелец')
    archived = models.BooleanField(default=False, verbose_name='Архивировано')

    class Meta:
        verbose_name = 'Medicine'
        verbose_name_plural = 'Medicines'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} {self.dosage}"

    def get_price_per_pill(self):
        if self.price_type == 'pill':
            return self.price_per_pill or 0
        elif self.price_type == 'package' and self.price_per_package:
            return self.price_per_package / self.pills_per_package
        return 0

    def get_price_per_package(self):
        if self.price_type == 'package':
            return self.price_per_package or 0
        elif self.price_type == 'pill' and self.price_per_pill:
            return self.price_per_pill * self.pills_per_package
        return 0

    def get_remaining_quantity(self):
        """Получить оставшееся количество на складе"""
        return max(0, self.stock_quantity - self.sold_quantity - self.given_quantity)

    def get_pharmacy_remaining(self, pharmacy):
        """Получить остаток лекарства в конкретной аптеке"""
        given_transactions = PharmacyMedicineTransaction.objects.filter(
            medicine=self,
            pharmacy=pharmacy,
            transaction_type='given',
            archived=False
        ).aggregate(total=models.Sum('quantity_pills'))['total'] or 0
        
        sold_transactions = PharmacyMedicineTransaction.objects.filter(
            medicine=self,
            pharmacy=pharmacy,
            transaction_type='sold',
            archived=False
        ).aggregate(total=models.Sum('quantity_pills'))['total'] or 0
        
        return max(0, given_transactions - sold_transactions)

    def get_total_value(self):
        """Получить общую стоимость остатков"""
        remaining = self.get_remaining_quantity()
        price_per_unit = self.get_price_per_pill()
        return remaining * price_per_unit

auditlog.register(MedicineModel)

class PharmacyMedicineTransaction(BaseModel):
    pharmacy = models.ForeignKey(PharmacyModel, on_delete=models.CASCADE, related_name='medicine_transactions')
    medicine = models.ForeignKey(MedicineModel, on_delete=models.CASCADE, related_name='pharmacy_transactions')
    quantity_pills = models.IntegerField(verbose_name='Количество таблеток')
    quantity_packages = models.IntegerField(verbose_name='Количество упаковок')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPE_CHOICES, verbose_name='Тип транзакции')
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена за единицу')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Общая цена')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Владелец')
    archived = models.BooleanField(default=False, verbose_name='Архивировано')

    class Meta:
        verbose_name = 'Pharmacy Medicine Transaction'
        verbose_name_plural = 'Pharmacy Medicine Transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.medicine.name} - {self.pharmacy.name} ({self.transaction_type})"

    def save(self, *args, **kwargs):
        # Автоматически рассчитываем общую стоимость
        total_quantity = self.quantity_pills * self.quantity_packages
        self.total_price = total_quantity * self.price_per_unit
        
        # Обновляем количества в основной модели лекарства
        if self.transaction_type == 'given':
            self.medicine.given_quantity += total_quantity
        elif self.transaction_type == 'sold':
            self.medicine.sold_quantity += total_quantity
        elif self.transaction_type == 'returned':
            if self.medicine.sold_quantity >= total_quantity:
                self.medicine.sold_quantity -= total_quantity
        
        self.medicine.save()
        super().save(*args, **kwargs)

auditlog.register(MedicineModel)

# Обновляем существующую модель транзакций для совместимости
class TransactionModel(BaseModel):
    pharmacy = models.ForeignKey(PharmacyModel, on_delete=models.CASCADE, related_name='transactions')
    medicine = models.ForeignKey(MedicineModel, on_delete=models.CASCADE, related_name='transactions')
    quantity_pills = models.IntegerField(verbose_name='Количество таблеток')
    quantity_packages = models.IntegerField(verbose_name='Количество упаковок')
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена за единицу')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Общая цена')
    transaction_type = models.CharField(max_length=10, choices=[('sale', 'Продажа'), ('return', 'Возврат')], default='sale')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Владелец')
    archived = models.BooleanField(default=False, verbose_name='Архивировано')

    class Meta:
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.medicine.name} - {self.pharmacy.name}"

auditlog.register(TransactionModel)

class PharmacyProductReceiptModel(BaseModel):
    pharmacy = models.ForeignKey(PharmacyModel, on_delete=models.CASCADE, related_name='product_receipts')
    total_price = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name='Umumiy narx')
    total_count = models.IntegerField(default=0, verbose_name='Umumiy soni')
    products = models.JSONField(default=list, verbose_name='Mahsulotlar ro\'yxati')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Vlaedec')

    class Meta:
        verbose_name = 'Pharmacy Product Receipt'
        verbose_name_plural = 'Pharmacy Product Receipts'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.pharmacy.name} uchun mahsulotlar (Umumiy: {self.total_price})"

auditlog.register(PharmacyProductReceiptModel)

class PharmacyDebtPaymentModel(BaseModel):
    pharmacy = models.ForeignKey(PharmacyModel, on_delete=models.CASCADE, related_name='debt_payments')
    amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='To\'lov summasi')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Владелец')
    archived = models.BooleanField(default=False, verbose_name='Архивировано')

    class Meta:
        verbose_name = 'Pharmacy Debt Payment'
        verbose_name_plural = 'Pharmacy Debt Payments'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.pharmacy.name} - {self.amount}"

auditlog.register(PharmacyDebtPaymentModel)