from rest_framework import serializers
from .models import Satellite, TLEEntry, RiskReport, PredictionReport

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

class PredictionReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionReport
        fields = '__all__'
