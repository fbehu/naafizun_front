from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import UserModel

class RegisterSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = UserModel
        fields = [
            'username',
            'password',
            'confirm_password',
            'role',
            'first_name',
            'last_name',
            'image',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate(self, data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            # Faqat superadmin foydalanuvchi register qilishi mumkin
            if not hasattr(user, 'role') or user.role != 'superadmin':
                raise serializers.ValidationError("Siz uchun ruxst yo'q")
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Parollar mos kelmadi")
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            if not hasattr(user, 'role') or user.role != 'superadmin':
                raise serializers.ValidationError("Siz uchun ruxst yo'q")
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')

        user = UserModel(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True, max_length=150)
    password = serializers.CharField(max_length=255, write_only=True)

    def validate(self, data):
        username = data.get("username")
        password = data.get("password")

        if not username:
            raise serializers.ValidationError("Username kiritilishi kerak.")

        user = UserModel.objects.filter(username=username).first()

        if not user:
            raise serializers.ValidationError("Foydalanuvchi topilmadi.")

        if not user.check_password(password):
            raise serializers.ValidationError("Username yoki parol noto‘g‘ri.")

        if not user.is_active:
            raise serializers.ValidationError("Foydalanuvchi faollashtirilmagan.")

        data["user"] = user
        return data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()
    default_error_messages = {
        'bad_token': 'Token not valid or expired',
        'no_token': 'Token is missing'
    }

    def validate(self, attrs):
        self.token = attrs['refresh']
        return attrs

    def save(self, **kwargs):
        try:
            RefreshToken(self.token).blacklist()
        except TokenError:
            self.fail('bad_token')

class UserModelSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = UserModel
        fields = [
            'id', 'username', 'password', 'image',
            'role', 'last_login', 'date_joined', 
            'first_name', 'last_name', 'phone_number'

        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.get('role')
        user = UserModel(**validated_data)
        user.set_password(password)
        # Faqat superadmin uchun is_staff True
        user.is_staff = True if role == 'superadmin' else False
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        validated_data.pop('confirm_password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        # Faqat superadmin uchun is_staff True
        if hasattr(instance, 'role'):
            instance.is_staff = True if instance.role == 'superadmin' else False
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate_new_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak.")
        return value

    def validate(self, data):
        user = self.context['request'].user
        if not user.check_password(data['old_password']):
            raise serializers.ValidationError({"old_password": "Joriy parol noto'g'ri"})
        if data['old_password'] == data['new_password']:
            raise serializers.ValidationError({"new_password": "Yangi parol joriy paroldan farqli bo'lishi kerak"})
        return data
