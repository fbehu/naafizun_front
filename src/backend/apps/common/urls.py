from django.urls import path, include

urlpatterns = [
    # App URLs
    path('products/', include('apps.products.urls')),
    path('users/', include('apps.users.urls')),
    path('pharmacy/', include('apps.pharmacy.urls')),
    path('messages/', include('apps.message.urls')),
    path('audit_logs/', include('apps.audit_api.urls')),
    path('company/', include('apps.companies.urls')),
]
