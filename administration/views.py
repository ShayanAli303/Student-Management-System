from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole
from administration.models import Fee, PasswordChangeRequest, SchoolClass
from administration.serializers import (
    AdminStudentSerializer,
    AdminTeacherSerializer,
    FeeSerializer,
    PasswordRequestAdminSerializer,
    SchoolClassSerializer,
    StudentOptionSerializer,
    TeacherOptionSerializer,
)
from students.models import Attendance, Grade, StudentProfile
from teachers.models import TeacherProfile


class AdminDashboardView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, _request):
        return Response(
            {
                "summary": {
                    "students": StudentProfile.objects.count(),
                    "teachers": TeacherProfile.objects.count(),
                    "classes": SchoolClass.objects.count(),
                    "attendance_records": Attendance.objects.count(),
                    "grade_records": Grade.objects.count(),
                    "fees_total": float(Fee.objects.aggregate(total=Sum("amount")).get("total") or 0),
                    "pending_requests": PasswordChangeRequest.objects.filter(status=PasswordChangeRequest.STATUS_PENDING).count(),
                },
                "recent_requests": PasswordRequestAdminSerializer(
                    PasswordChangeRequest.objects.select_related("user").all()[:8],
                    many=True,
                ).data,
                "class_breakdown": list(SchoolClass.objects.annotate(total_students=Count("students")).values("name", "section", "total_students")),
            }
        )


class TeacherViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = TeacherProfile.objects.select_related("user").all()
    serializer_class = AdminTeacherSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = StudentProfile.objects.select_related("user", "school_class").all()
    serializer_class = AdminStudentSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SchoolClassViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = SchoolClass.objects.select_related("teacher", "teacher__user").all()
    serializer_class = SchoolClassSerializer


class FeeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = Fee.objects.select_related("student", "student__user").all()
    serializer_class = FeeSerializer


class AdminMetaView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, _request):
        return Response(
            {
                "teachers": TeacherOptionSerializer(TeacherProfile.objects.select_related("user"), many=True).data,
                "students": StudentOptionSerializer(StudentProfile.objects.select_related("user"), many=True).data,
                "classes": SchoolClassSerializer(SchoolClass.objects.select_related("teacher", "teacher__user"), many=True).data,
            }
        )


class AdminPasswordRequestViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminRole]
    queryset = PasswordChangeRequest.objects.select_related("user").all()
    serializer_class = PasswordRequestAdminSerializer

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        instance = self.get_object()
        instance.status = PasswordChangeRequest.STATUS_RESOLVED
        instance.resolved_at = timezone.now()
        instance.save(update_fields=["status", "resolved_at"])
        return Response({"detail": "Request marked as resolved."})
