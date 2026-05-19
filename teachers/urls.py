from django.urls import include, path
from rest_framework.routers import DefaultRouter

from teachers.views import TeacherAttendanceViewSet, TeacherDashboardView, TeacherGradeViewSet

router = DefaultRouter()
router.register("attendance", TeacherAttendanceViewSet, basename="teacher-attendance")
router.register("grades", TeacherGradeViewSet, basename="teacher-grades")

urlpatterns = [
    path("dashboard/", TeacherDashboardView.as_view(), name="teacher-dashboard"),
    path("", include(router.urls)),
]
