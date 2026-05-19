from django.contrib.auth import authenticate
from rest_framework import serializers

from accounts.models import User
from administration.models import PasswordChangeRequest
from students.models import StudentProfile
from teachers.models import TeacherProfile


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["username"],
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        if user.role != attrs["role"]:
            raise serializers.ValidationError("Selected role does not match this account.")
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")
        attrs["user"] = user
        return attrs


class UserSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "full_name"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class MeSerializer(UserSummarySerializer):
    profile = serializers.SerializerMethodField()

    class Meta(UserSummarySerializer.Meta):
        fields = UserSummarySerializer.Meta.fields + ["profile"]

    def get_profile(self, obj):
        if obj.role == User.ROLE_TEACHER and hasattr(obj, "teacher_profile"):
            profile = obj.teacher_profile
            return {
                "id": profile.id,
                "employee_id": profile.employee_id,
                "department": profile.department,
                "phone": profile.phone,
            }
        if obj.role == User.ROLE_STUDENT and hasattr(obj, "student_profile"):
            profile = obj.student_profile
            return {
                "id": profile.id,
                "admission_number": profile.admission_number,
                "guardian_name": profile.guardian_name,
                "phone": profile.phone,
            }
        return None


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=False, allow_blank=True)
    new_password = serializers.CharField(min_length=6)


class PasswordRequestSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)

    class Meta:
        model = PasswordChangeRequest
        fields = [
            "id",
            "user_id",
            "username",
            "role",
            "request_type",
            "message",
            "status",
            "created_at",
            "resolved_at",
        ]
        read_only_fields = ["status", "created_at", "resolved_at", "role"]


class ForgotPasswordSerializer(serializers.Serializer):
    username = serializers.CharField()
    role = serializers.ChoiceField(choices=((User.ROLE_TEACHER, "Teacher"), (User.ROLE_STUDENT, "Student")))

    def validate(self, attrs):
        try:
            user = User.objects.get(username=attrs["username"], role=attrs["role"])
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("No account found for the provided username and role.") from exc
        attrs["user"] = user
        return attrs


class PasswordCatalogUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    label = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name", "plain_password", "label"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_label(self, obj):
        if obj.role == User.ROLE_TEACHER and hasattr(obj, "teacher_profile"):
            return obj.teacher_profile.employee_id
        if obj.role == User.ROLE_STUDENT and hasattr(obj, "student_profile"):
            return obj.student_profile.admission_number
        return ""


class AdminPasswordResetSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    new_password = serializers.CharField(min_length=6)

    def validate_user_id(self, value):
        try:
            user = User.objects.get(pk=value)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("User not found.") from exc
        if user.role not in {User.ROLE_STUDENT, User.ROLE_TEACHER, User.ROLE_ADMIN}:
            raise serializers.ValidationError("Unsupported role.")
        self.context["target_user"] = user
        return value
