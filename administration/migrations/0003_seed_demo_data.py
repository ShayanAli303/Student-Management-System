from decimal import Decimal

from django.db import migrations
from django.contrib.auth.hashers import make_password


def seed_demo_data(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    TeacherProfile = apps.get_model("teachers", "TeacherProfile")
    StudentProfile = apps.get_model("students", "StudentProfile")
    SchoolClass = apps.get_model("administration", "SchoolClass")
    Attendance = apps.get_model("students", "Attendance")
    Grade = apps.get_model("students", "Grade")
    Fee = apps.get_model("administration", "Fee")

    if User.objects.filter(username="admin").exists():
        return

    admin_user = User(
        username="admin",
        role="admin",
        is_staff=True,
        is_superuser=True,
        is_active=True,
        plain_password="admin123",
        password=make_password("admin123"),
    )
    admin_user.save()

    teacher_user = User(
        username="teacher1",
        first_name="Ayesha",
        last_name="Khan",
        email="teacher1@sms.local",
        role="teacher",
        is_active=True,
        plain_password="teacher123",
        password=make_password("teacher123"),
    )
    teacher_user.save()
    teacher = TeacherProfile.objects.create(
        user=teacher_user,
        employee_id="T-1001",
        department="Science",
        phone="+92-300-1111111",
        address="Main Campus",
    )

    school_class = SchoolClass.objects.create(
        name="Grade 10",
        section="A",
        room="R-12",
        schedule="Mon-Fri 08:00 - 12:00",
        description="Senior section science class.",
        teacher=teacher,
    )

    student_user = User(
        username="student1",
        first_name="Ali",
        last_name="Raza",
        email="student1@sms.local",
        role="student",
        is_active=True,
        plain_password="student123",
        password=make_password("student123"),
    )
    student_user.save()
    student = StudentProfile.objects.create(
        user=student_user,
        school_class=school_class,
        admission_number="S-2026-001",
        guardian_name="Raza Ahmed",
        phone="+92-300-2222222",
        address="Model Town",
    )

    Attendance.objects.create(
        student=student,
        school_class=school_class,
        recorded_by=teacher,
        date="2026-05-15",
        status="present",
        remarks="On time",
    )
    Grade.objects.create(
        student=student,
        school_class=school_class,
        graded_by=teacher,
        subject="Mathematics",
        exam_name="Mid Term",
        score=Decimal("88.00"),
        max_score=Decimal("100.00"),
        remarks="Strong performance",
    )
    Fee.objects.create(
        student=student,
        title="Monthly Tuition",
        amount=Decimal("120.00"),
        amount_paid=Decimal("40.00"),
        due_date="2026-05-25",
        status="partial",
        notes="Balance due this month.",
    )


def remove_demo_data(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(username__in=["student1", "teacher1", "admin"]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("administration", "0002_initial"),
    ]

    operations = [
        migrations.RunPython(seed_demo_data, remove_demo_data),
    ]
