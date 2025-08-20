from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Satellite, TLEEntry, RiskReport, PredictionReport, User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'email_verified', 'is_staff', 'is_active', 'created_at')
    list_filter = ('email_verified', 'is_staff', 'is_active', 'created_at')
    search_fields = ('email', 'username')
    ordering = ('-created_at',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('email_verified', 'verification_token')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('email_verified', 'verification_token')}),
    )

@admin.register(Satellite)
class SatelliteAdmin(admin.ModelAdmin):
    list_display = ('name', 'norad_id', 'intl_designator')
    search_fields = ('name', 'norad_id', 'intl_designator')
    list_filter = ('intl_designator',)

@admin.register(TLEEntry)
class TLEEntryAdmin(admin.ModelAdmin):
    list_display = ('satellite', 'timestamp')
    list_filter = ('timestamp', 'satellite')
    search_fields = ('satellite__name', 'satellite__norad_id')

@admin.register(RiskReport)
class RiskReportAdmin(admin.ModelAdmin):
    list_display = ('satellite_1', 'satellite_2', 'predicted_at', 'time_of_closest_approach', 'miss_distance_km', 'collision_probability')
    list_filter = ('predicted_at', 'time_of_closest_approach')
    search_fields = ('satellite_1__name', 'satellite_2__name')

@admin.register(PredictionReport)
class PredictionReportAdmin(admin.ModelAdmin):
    list_display = ('sat1_id', 'sat2_id', 'miss_distance', 'probability', 'tca', 'created_at')
    list_filter = ('created_at', 'tca')
    search_fields = ('sat1_id', 'sat2_id')
