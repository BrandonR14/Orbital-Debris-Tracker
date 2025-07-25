from django.contrib import admin
from .models import Satellite, TLEEntry, RiskReport, PredictionReport

admin.site.register(Satellite)
admin.site.register(TLEEntry)
admin.site.register(RiskReport)
admin.site.register(PredictionReport)
