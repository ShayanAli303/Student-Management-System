from rest_framework import serializers

from accounts.models import User
from administration.models import Fee, PasswordChangeRequest, SchoolClass
from students.models import StudentProfile
from teachers.models import TeacherProfile


class TeacherOptionSerializer(serializers.ModelSerializer):
    user_full_name = serializers.SerializerMethodField()

    class Meta:
        model = TeacherProfile
        fields = ["id", "employee_id", "department", "user_full_name"]

    def get_user_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class SchoolClassSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = SchoolClass
        fields = ["id", "name", "section", "room", "schedule", "description", "teacher", "teacher_name"]

    def get_teacher_name(self, obj):
        if not obj.teacher:
            return ""
        return obj.teacher.user.get_full_name() or obj.teacher.user.username


class AdminTeacherSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username")
    email = serializers.EmailField(source="user.email", allow_blank=True, required=False)
    first_name = serializers.CharField(source="user.first_name", allow_blank=True, required=False)
    last_name = serializers.CharField(source="user.last_name", allow_blank=True, required=False)
    plain_password = serializers.CharField(source="user.plain_password", write_only=True, required=False)

    class Meta:
        model = TeacherProfile
        fields = [
            "id",
            "user_id",
            "username",
            "email",
            "first_name",
            "last_name",
            "plain_password",
            "employee_id",
            "department",
            "phone",
            "address",
        ]

    def create(self, validated_data):
        user_data = validated_data.pop("user")
        password = user_data.pop("plain_password", "teacher123")
        user = User.objects.create_user(password=password, role=User.ROLE_TEACHER, **user_data)
        return TeacherProfile.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        password = user_data.pop("plain_password", None)
        for field, value in user_data.items():
            setattr(instance.user, field, value)
        if password:
            instance.user.set_password(password)
            instance.user.plain_password = password
        instance.user.save()

        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


class StudentOptionSerializer(serializers.ModelSerializer):
    user_full_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = ["id", "admission_number", "user_full_name"]

    def get_user_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class AdminStudentSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username")
    email = serializers.EmailField(source="user.email", allow_blank=True, required=False)
    first_name = serializers.CharField(source="user.first_name", allow_blank=True, required=False)
    last_name = serializers.CharField(source="user.last_name", allow_blank=True, required=False)
    plain_password = serializers.CharField(source="user.plain_password", write_only=True, required=False)
    class_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user_id",
            "username",
            "email",
            "first_name",
            "last_name",
            "plain_password",
            "admission_number",
            "guardian_name",
            "phone",
            "address",
            "date_of_birth",
            "school_class",
            "class_name",
        ]

    def get_class_name(self, obj):
        return str(obj.school_class) if obj.school_class else ""

    def create(self, validated_data):
        user_data = validated_data.pop("user")
        password = user_data.pop("plain_password", "student123")
        user = User.objects.create_user(password=password, role=User.ROLE_STUDENT, **user_data)
        return StudentProfile.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        password = user_data.pop("plain_password", None)
        for field, value in user_data.items():
            setattr(instance.user, field, value)
        if password:
            instance.user.set_password(password)
            instance.user.plain_password = password
        instance.user.save()

        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


class FeeSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Fee
        fields = [
            "id",
            "student",
            "student_name",
            "title",
            "amount",
            "amount_paid",
            "due_date",
            "status",
            "notes",
            "created_at",
        ]

    def get_student_name(self, obj):
        return obj.student.user.get_full_name() or obj.student.user.username


class PasswordRequestAdminSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)

    class Meta:
        model = PasswordChangeRequest
        fields = ["id", "user_id", "username", "role", "request_type", "message", "status", "created_at", "resolved_at"]
