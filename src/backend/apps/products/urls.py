from rest_framework.routers import DefaultRouter
from .views import ProductViewSet
from .debt_views import DebtViewSet

router = DefaultRouter()

router.register(r'products', ProductViewSet, basename='products')
router.register(r'debts', DebtViewSet, basename='debts')

urlpatterns = router.urls
