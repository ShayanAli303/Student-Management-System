from rest_framework.views import APIView
from rest_framework.response import Response

from accounts.permissions import IsStudentRole
from administration.models import Fee
from students.serializers import StudentAttendanceSerializer, StudentClassSerializer, StudentFeeSerializer, StudentGradeSerializer


class StudentDashboardView(APIView):
    permission_classes = [IsStudentRole]

    def get(self, request):
        profile = request.user.student_profile
        attendance = profile.attendance_records.select_related("school_class").all()
        grades = profile.grades.select_related("school_class").all()
        fees = Fee.objects.filter(student=profile).all()
        school_class = profile.school_class

        present_count = profile.attendance_records.filter(status="present").count()
        total_attendance = profile.attendance_records.count()
        attendance_rate = round((present_count / total_attendance) * 100, 1) if total_attendance else 0
        fees_due = 0
        for fee in fees:
            if fee.status == Fee.STATUS_PAID:
                continue
            outstanding_amount = fee.amount - fee.amount_paid
            if outstanding_amount > 0:
                fees_due += outstanding_amount

        return Response(
            {
                "summary": {
                    "attendance_rate": attendance_rate,
                    "subjects": grades.values("subject").distinct().count(),
                    "fees_due": float(fees_due),
                },
                "profile": {
                    "admission_number": profile.admission_number,
                    "guardian_name": profile.guardian_name,
                    "phone": profile.phone,
                    "address": profile.address,
                },
                "class_info": StudentClassSerializer(school_class).data if school_class else None,
                "attendance": StudentAttendanceSerializer(attendance, many=True).data,
                "grades": StudentGradeSerializer(grades, many=True).data,
                "fees": StudentFeeSerializer(fees, many=True).data,
            }
        )
