from django.urls import path, re_path, include
from django.contrib import admin
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.conf.urls.static import static
from rest_framework import permissions

from config import settings

schema_view = get_schema_view(
    openapi.Info(
        title="NAFIZUN",
        default_version='v1',
        description="Your API description here",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="your-email@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.common.urls')),
    path('api/', include('apps.polyclinic_doctors.urls')),
    path('api/', include('apps.notes.urls')),
    path('api/', include('apps.notification.urls')),

]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


# Swagger URLS
urlpatterns += [
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'), ]