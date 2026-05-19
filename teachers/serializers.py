from rest_framework import serializers

from administration.models import SchoolClass
from students.models import Attendance, Grade, StudentProfile


class TeacherClassSerializer(serializers.ModelSerializer):
    students = serializers.SerializerMethodField()

    class Meta:
        model = SchoolClass
        fields = ["id", "name", "section", "room", "schedule", "description", "students"]

    def get_students(self, obj):
        return [
            {
                "id": student.id,
                "admission_number": student.admission_number,
                "name": student.user.get_full_name() or student.user.username,
            }
            for student in obj.students.select_related("user").all()
        ]


class TeacherAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = ["id", "student", "student_name", "school_class", "class_name", "date", "status", "remarks"]

    def get_student_name(self, obj):
        return obj.student.user.get_full_name() or obj.student.user.username

    def get_class_name(self, obj):
        return str(obj.school_class)

    def validate(self, attrs):
        school_class = attrs.get("school_class") or getattr(self.instance, "school_class", None)
        student = attrs.get("student") or getattr(self.instance, "student", None)
        teacher_profile = self.context["request"].user.teacher_profile
        if school_class and school_class.teacher_id != teacher_profile.id:
            raise serializers.ValidationError("You can only manage attendance for your assigned classes.")
        if student and school_class and student.school_class_id != school_class.id:
            raise serializers.ValidationError("Selected student does not belong to this class.")
        return attrs


class TeacherGradeSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()

    class Meta:
        model = Grade
        fields = [
            "id",
            "student",
            "student_name",
            "school_class",
            "class_name",
            "subject",
            "exam_name",
            "score",
            "max_score",
            "remarks",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def get_student_name(self, obj):
        return obj.student.user.get_full_name() or obj.student.user.username

    def get_class_name(self, obj):
        return str(obj.school_class)

    def validate(self, attrs):
        school_class = attrs.get("school_class") or getattr(self.instance, "school_class", None)
        student = attrs.get("student") or getattr(self.instance, "student", None)
        teacher_profile = self.context["request"].user.teacher_profile
        if school_class and school_class.teacher_id != teacher_profile.id:
            raise serializers.ValidationError("You can only manage grades for your assigned classes.")
        if student and school_class and student.school_class_id != school_class.id:
            raise serializers.ValidationError("Selected student does not belong to this class.")
        return attrs


class TeacherDashboardSerializer(serializers.Serializer):
    summary = serializers.DictField()
    classes = TeacherClassSerializer(many=True)
    attendance = TeacherAttendanceSerializer(many=True)
    grades = TeacherGradeSerializer(many=True)
