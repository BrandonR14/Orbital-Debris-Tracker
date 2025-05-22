from rest_framework import serializers
from .models import Satellite, TLEEntry, RiskReport

class SatelliteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Satellite
        fields = '__all__'

class TLEEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = TLEEntry
        fields = '__all__'

class RiskReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskReport
        fields = '__all__'
