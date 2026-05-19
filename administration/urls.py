from rest_framework.routers import DefaultRouter
from django.urls import include, path

from administration.views import (
    AdminDashboardView,
    AdminMetaView,
    AdminPasswordRequestViewSet,
    FeeViewSet,
    SchoolClassViewSet,
    StudentViewSet,
    TeacherViewSet,
)

router = DefaultRouter()
router.register("teachers", TeacherViewSet, basename="admin-teachers")
router.register("students", StudentViewSet, basename="admin-students")
router.register("classes", SchoolClassViewSet, basename="admin-classes")
router.register("fees", FeeViewSet, basename="admin-fees")
router.register("password-requests", AdminPasswordRequestViewSet, basename="admin-password-requests")

urlpatterns = [
    path("dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("meta/", AdminMetaView.as_view(), name="admin-meta"),
    path("", include(router.urls)),
]
