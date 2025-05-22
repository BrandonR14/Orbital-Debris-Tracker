from django.contrib import admin
from .models import Satellite, TLEEntry, RiskReport

admin.site.register(Satellite)
admin.site.register(TLEEntry)
admin.site.register(RiskReport)

