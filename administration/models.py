from django.conf import settings
from django.db import models


class SchoolClass(models.Model):
    name = models.CharField(max_length=120)
    section = models.CharField(max_length=30)
    room = models.CharField(max_length=40, blank=True)
    schedule = models.CharField(max_length=120, blank=True)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(
        "teachers.TeacherProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_classes",
    )

    class Meta:
        ordering = ["name", "section"]
        unique_together = ("name", "section")

    def __str__(self):
        return f"{self.name} - {self.section}"


class Fee(models.Model):
    STATUS_PENDING = "pending"
    STATUS_PARTIAL = "partial"
    STATUS_PAID = "paid"

    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_PARTIAL, "Partial"),
        (STATUS_PAID, "Paid"),
    )

    student = models.ForeignKey("students.StudentProfile", on_delete=models.CASCADE, related_name="fees")
    title = models.CharField(max_length=120)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["due_date", "student__admission_number"]

    def __str__(self):
        return f"{self.student} - {self.title}"


class PasswordChangeRequest(models.Model):
    TYPE_REQUEST = "request"
    TYPE_CHANGE = "change"
    TYPE_FORGOT = "forgot"
    TYPE_CHOICES = (
        (TYPE_REQUEST, "Password Change Request"),
        (TYPE_CHANGE, "Password Changed"),
        (TYPE_FORGOT, "Forgot Password"),
    )

    STATUS_PENDING = "pending"
    STATUS_RESOLVED = "resolved"
    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_RESOLVED, "Resolved"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="password_requests")
    role = models.CharField(max_length=20)
    request_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.request_type}"
