from django.urls import path

from students.views import StudentDashboardView

urlpatterns = [
    path("dashboard/", StudentDashboardView.as_view(), name="student-dashboard"),
]
