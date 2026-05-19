from django.contrib.auth import login, logout, update_session_auth_hash
from django.db.models import Count
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import TemplateView
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import IsAdminRole
from accounts.serializers import (
    AdminPasswordResetSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    MeSerializer,
    PasswordCatalogUserSerializer,
    PasswordRequestSerializer,
)
from administration.models import PasswordChangeRequest
from administration.models import SchoolClass
from students.models import Attendance, Grade, StudentProfile
from teachers.models import TeacherProfile


@method_decorator(ensure_csrf_cookie, name="dispatch")
class FrontendAppView(TemplateView):
    template_name = "index.html"


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health_check(_request):
    return Response({"status": "ok"})


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request, user)
        return Response({"user": MeSerializer(user).data})


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"user": None})
        return Response({"user": MeSerializer(request.user).data})


class DashboardSummaryView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response(
            {
                "students": StudentProfile.objects.count(),
                "teachers": TeacherProfile.objects.count(),
                "classes": SchoolClass.objects.count(),
                "attendance_records": Attendance.objects.count(),
                "grade_records": Grade.objects.count(),
                "pending_requests": PasswordChangeRequest.objects.filter(status=PasswordChangeRequest.STATUS_PENDING).count(),
                "roles": User.objects.values("role").annotate(total=Count("id")),
            }
        )


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        current_password = serializer.validated_data.get("current_password")
        if user.role != User.ROLE_ADMIN and not user.check_password(current_password or ""):
            return Response({"detail": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        new_password = serializer.validated_data["new_password"]
        user.set_password(new_password)
        user.plain_password = new_password
        user.save(update_fields=["password", "plain_password"])
        update_session_auth_hash(request, user)
        PasswordChangeRequest.objects.create(
            user=user,
            role=user.role,
            request_type=PasswordChangeRequest.TYPE_CHANGE,
            message=f"{user.username} changed the password from the dashboard.",
            status=PasswordChangeRequest.STATUS_RESOLVED,
            resolved_at=timezone.now(),
        )
        return Response({"detail": "Password updated successfully."})


class PasswordRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = PasswordChangeRequest.objects.all()
        if request.user.role != User.ROLE_ADMIN:
            queryset = queryset.filter(user=request.user)
        serializer = PasswordRequestSerializer(queryset.order_by("-created_at"), many=True)
        return Response({"requests": serializer.data})

    def post(self, request):
        if request.user.role == User.ROLE_ADMIN:
            return Response({"detail": "Admins do not submit password requests here."}, status=status.HTTP_400_BAD_REQUEST)

        message = request.data.get("message") or "Password change requested."
        req = PasswordChangeRequest.objects.create(
            user=request.user,
            role=request.user.role,
            request_type=PasswordChangeRequest.TYPE_REQUEST,
            message=message,
        )
        return Response(PasswordRequestSerializer(req).data, status=status.HTTP_201_CREATED)


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        password_request = PasswordChangeRequest.objects.create(
            user=user,
            role=user.role,
            request_type=PasswordChangeRequest.TYPE_FORGOT,
            message=f"Forgot password request submitted for {user.username}.",
        )
        return Response(
            {
                "detail": "Admin will contact you regarding this request.",
                "request": PasswordRequestSerializer(password_request).data,
            },
            status=status.HTTP_201_CREATED,
        )


class PasswordCatalogView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, _request):
        teachers = User.objects.filter(role=User.ROLE_TEACHER).select_related("teacher_profile")
        students = User.objects.filter(role=User.ROLE_STUDENT).select_related("student_profile")
        return Response(
            {
                "teachers": PasswordCatalogUserSerializer(teachers, many=True).data,
                "students": PasswordCatalogUserSerializer(students, many=True).data,
            }
        )


class AdminPasswordResetView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = AdminPasswordResetSerializer(data=request.data, context={})
        serializer.is_valid(raise_exception=True)
        target_user = serializer.context["target_user"]
        new_password = serializer.validated_data["new_password"]
        target_user.set_password(new_password)
        target_user.plain_password = new_password
        target_user.save(update_fields=["password", "plain_password"])
        PasswordChangeRequest.objects.filter(user=target_user, status=PasswordChangeRequest.STATUS_PENDING).update(
            status=PasswordChangeRequest.STATUS_RESOLVED,
            resolved_at=timezone.now(),
        )
        return Response({"detail": f"Password reset for {target_user.username}."})
