from django.contrib import admin
from administration.models import Fee, PasswordChangeRequest, SchoolClass

admin.site.register(SchoolClass)
admin.site.register(Fee)
admin.site.register(PasswordChangeRequest)
