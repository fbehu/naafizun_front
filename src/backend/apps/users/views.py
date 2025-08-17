from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import LoginSerializer, LogoutSerializer, UserModelSerializer, RegisterSerializer, ChangePasswordSerializer
from .models import UserModel
from rest_framework import viewsets
from rest_framework.decorators import action
from apps.common.permissions import IsSuperadminOrAdmin

class RegisterView(APIView):
    serializer_class = RegisterSerializer
    permission_classes = [IsAuthenticated, IsSuperadminOrAdmin]

    def post(self, request, *args, **kwargs):
        user = request.user
        if not hasattr(user, 'role') or user.role != 'superadmin':
            return Response(
                {"success": False, "message": "Sizga ruxsat yo'q"},
                status=status.HTTP_200_OK
            )

        username = request.data.get('username')
        if username and UserModel.objects.filter(username=username).exists():
            return Response(
                {"success": False, "message": "Bu foydalanuvchi mavjud"},
                status=status.HTTP_200_OK
            )

        serializer = RegisterSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()

            if user.role == "superadmin":
                user.superuser = False
                user.is_staff = False
                user.save()

            return Response({
                "success": True,
                "message": "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tkazildi!",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "role": user.role,
                }
            }, status=status.HTTP_201_CREATED)

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']

            refresh = RefreshToken.for_user(user)
            response = {
                'success': True,
                "message": "Muvaffaqiyatli tizimga kirildi!",
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    "id": user.id,
                    "username": user.username,
                    "role": user.role,
                    "first_name": user.first_name,
                    "phone_number": user.phone_number,
                    "last_login": user.last_login,
                    "date_joined": user.date_joined,
                    "is_active": user.is_active,
                    
                }
            }
            return Response(response, status=status.HTTP_200_OK)

        response = {
            "success": False,
            "message": "Username yoki parol xato!",
            "errors": serializer.errors
        }
        return Response(response, status=status.HTTP_200_OK)


class LogoutView(APIView):
    serializer_class = LogoutSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"success": False, "message": "Token taqdim etilmadi!"}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"success": True, "message": "Siz tizimdan chiqdingiz!"}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"success": False, "message": "Xatolik yuz berdi!", "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserModelViewSet(viewsets.ModelViewSet):
    queryset = UserModel.objects.all()
    serializer_class = UserModelSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def get_queryset(self):
        user = self.request.user

        if user.role == "superadmin":
            return UserModel.objects.all()

        return UserModel.objects.filter(id=user.id)

    def create(self, request, *args, **kwargs):
        # Foydalanuvchi roli admin emasligini tekshirish
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response(
                {"success": False, "message": "Siz bu huquqga ega emassiz!"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['put'], permission_classes=[IsAuthenticated])
    def change_password(self, request, pk=None):
        user = self.get_object()
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"success": True, "message": "Parol muvaffaqiyatli o'zgartirildi!"})
        return Response({"success": False, "errors": serializer.errors}, status=400)