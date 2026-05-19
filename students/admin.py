from django.contrib import admin
from students.models import Attendance, Grade, StudentProfile

admin.site.register(StudentProfile)
admin.site.register(Attendance)
admin.site.register(Grade)
