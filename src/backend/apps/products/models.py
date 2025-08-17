from django.contrib.auth import get_user_model
from django.db import models
from auditlog.registry import auditlog
from apps.common.models import BaseModel

User = get_user_model()

TYPE = (
    ('pachka', 'Пачка'),
    ('dona', 'Дона'),
)

class ProductModel(BaseModel):
    name = models.CharField(max_length=255, verbose_name='Mahsulot nomi')
    dosage = models.CharField(max_length=50, verbose_name='Dozasi', blank=True, null=True)
    composition = models.CharField(max_length=255, blank=True, null=True, verbose_name='Tarkibi') 
    type = models.CharField(max_length=50, choices=TYPE, default='dona', verbose_name='Dori turi')  
    stock_quantity = models.IntegerField(default=0, verbose_name='Necha dona')
    pills_per_package = models.IntegerField(default=1, verbose_name='Har bir pachkada necha dona')
    loose_pills = models.IntegerField(default=0, verbose_name='Qoldiq dona')
    manufacturer = models.CharField(max_length=255, blank=True, null=True, verbose_name='Kompaniya nomi')
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='Kirib kelish narxi') 
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='Sotish narxi')
    total_purchase_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name='Umumiy kirib kelish summa')
    total_selling_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name='Umumiy sotish summa')
    total_stock = models.IntegerField(default=0, verbose_name='Umumiy necha dona ekanligi')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Владелец')
    archived = models.BooleanField(default=False, verbose_name='Архивировано')
    initial_debt = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        null=True, 
        blank=True, 
        verbose_name='Boshlang\'ich qarz'
    )
    remaining_debt = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        null=True, 
        blank=True, 
        verbose_name='Qolgan qarz'
    )
    # notification = models.BooleanField(default=False, verbose_name='Notification')
    
    class Meta:
        verbose_name = 'Product'
        verbose_name_plural = 'Products'

    def __str__(self):
        return self.name
    
auditlog.register(ProductModel)

class DebtModel(BaseModel):
    product = models.ForeignKey(ProductModel, on_delete=models.CASCADE, related_name='debts')
    initial_amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='Boshlang\'ich qarz')
    remaining_amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='Qolgan qarz')
    owner = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        verbose_name = 'Debt'
        verbose_name_plural = 'Debts'

    def __str__(self):
        return f"{self.product.name} - {self.remaining_amount}"

auditlog.register(DebtModel)
