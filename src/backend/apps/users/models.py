from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.db.models import ImageField
from auditlog.registry import auditlog


class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('Username is required')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'superadmin')
        return self.create_user(username, password, **extra_fields)

class UserModel(AbstractUser):
    ROLES = (
        ('admin', 'Admin'),
        ('superadmin', 'Boshliq'),
    )

    role = models.CharField(max_length=20, choices=ROLES, default='admin')
    first_name = models.CharField(max_length=30, blank=True, verbose_name='Ism')
    last_name = models.CharField(max_length=300, blank=True, null=True, verbose_name='Familya')
    phone_number = models.CharField(max_length=15, blank=True, verbose_name='Telefon raqam' )
    image = models.ImageField(upload_to='users_image/', verbose_name='Profil rasmi', blank=True, null=True)
    date_joined = models.DateTimeField(default=timezone.now, verbose_name='qo\'shilgan vaqt')
    last_login = models.DateTimeField(blank=True, null=True, verbose_name='yangilangan vaqt')

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        verbose_name='groups',
        help_text='The groups this user belongs to.',
    )

    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        verbose_name='user permissions',
        help_text='Specific permissions for this user.',
    )

    objects = CustomUserManager()

    def is_superadmin(self):
        return self.role == 'superadmin'

    def is_admin(self):
        return self.role == 'admin'

auditlog.register(UserModel)