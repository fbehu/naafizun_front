from rest_framework.permissions import BasePermission
from rest_framework import permissions

class IsSuperAdmin(BasePermission):
    """
    Faqat superadmin foydalanuvchilar uchun ruxsat.
    """
    def has_permission(self, request, view):
        return hasattr(request.user, 'role') and request.user.role == 'superadmin'



class IsSuperadminOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
            
        # Allow if user is superadmin or admin
        if request.user.role in ['superadmin', 'admin']:
            return True
            
        return False
