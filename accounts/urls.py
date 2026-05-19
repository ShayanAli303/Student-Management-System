from django.urls import path

from accounts.views import (
    AdminPasswordResetView,
    ChangePasswordView,
    DashboardSummaryView,
    ForgotPasswordView,
    LoginView,
    LogoutView,
    MeView,
    PasswordCatalogView,
    PasswordRequestView,
    health_check,
)

urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("auth/password-requests/", PasswordRequestView.as_view(), name="password-requests"),
    path("auth/forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("admin/summary/", DashboardSummaryView.as_view(), name="admin-summary"),
    path("admin/password-catalog/", PasswordCatalogView.as_view(), name="password-catalog"),
    path("admin/reset-password/", AdminPasswordResetView.as_view(), name="admin-reset-password"),
]
