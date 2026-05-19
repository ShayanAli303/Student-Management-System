from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsTeacherRole
from administration.models import SchoolClass
from students.models import Attendance, Grade
from teachers.serializers import TeacherAttendanceSerializer, TeacherClassSerializer, TeacherGradeSerializer


class TeacherDashboardView(APIView):
    permission_classes = [IsTeacherRole]

    def get(self, request):
        teacher_profile = request.user.teacher_profile
        classes = SchoolClass.objects.filter(teacher=teacher_profile).prefetch_related("students__user")
        attendance = Attendance.objects.filter(school_class__teacher=teacher_profile).select_related("student__user", "school_class")[:20]
        grades = Grade.objects.filter(school_class__teacher=teacher_profile).select_related("student__user", "school_class")[:20]
        total_students = sum(school_class.students.count() for school_class in classes)

        return Response(
            {
                "summary": {
                    "classes": classes.count(),
                    "students": total_students,
                    "attendance_records": Attendance.objects.filter(school_class__teacher=teacher_profile).count(),
                    "grade_records": Grade.objects.filter(school_class__teacher=teacher_profile).count(),
                },
                "classes": TeacherClassSerializer(classes, many=True).data,
                "attendance": TeacherAttendanceSerializer(attendance, many=True).data,
                "grades": TeacherGradeSerializer(grades, many=True).data,
            }
        )


class TeacherAttendanceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTeacherRole]
    serializer_class = TeacherAttendanceSerializer

    def get_queryset(self):
        return Attendance.objects.filter(school_class__teacher=self.request.user.teacher_profile).select_related("student__user", "school_class")

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user.teacher_profile)


class TeacherGradeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTeacherRole]
    serializer_class = TeacherGradeSerializer

    def get_queryset(self):
        return Grade.objects.filter(school_class__teacher=self.request.user.teacher_profile).select_related("student__user", "school_class")

    def perform_create(self, serializer):
        serializer.save(graded_by=self.request.user.teacher_profile)
