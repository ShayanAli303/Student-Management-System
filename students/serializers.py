from rest_framework import serializers

from administration.models import Fee, SchoolClass
from students.models import Attendance, Grade, StudentProfile


class StudentAttendanceSerializer(serializers.ModelSerializer):
    class_name = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = ["id", "date", "status", "remarks", "class_name"]

    def get_class_name(self, obj):
        return str(obj.school_class)


class StudentGradeSerializer(serializers.ModelSerializer):
    class_name = serializers.SerializerMethodField()

    class Meta:
        model = Grade
        fields = ["id", "subject", "exam_name", "score", "max_score", "remarks", "class_name", "created_at"]

    def get_class_name(self, obj):
        return str(obj.school_class)


class StudentFeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fee
        fields = ["id", "title", "amount", "amount_paid", "due_date", "status", "notes"]


class StudentClassSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = SchoolClass
        fields = ["id", "name", "section", "room", "schedule", "description", "teacher_name"]

    def get_teacher_name(self, obj):
        if not obj.teacher:
            return ""
        return obj.teacher.user.get_full_name() or obj.teacher.user.username


class StudentDashboardSerializer(serializers.Serializer):
    summary = serializers.DictField()
    profile = serializers.DictField()
    class_info = StudentClassSerializer(allow_null=True)
    attendance = StudentAttendanceSerializer(many=True)
    grades = StudentGradeSerializer(many=True)
    fees = StudentFeeSerializer(many=True)
