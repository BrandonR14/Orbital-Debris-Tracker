from django.shortcuts import render
from rest_framework import viewsets
from .models import Satellite, TLEEntry, RiskReport
from .serializers import SatelliteSerializer, TLEEntrySerializer, RiskReportSerializer

class SatelliteViewSet(viewsets.ModelViewSet):
    queryset = Satellite.objects.all()
    serializer_class = SatelliteSerializer

class TLEEntryViewSet(viewsets.ModelViewSet):
    queryset = TLEEntry.objects.all()
    serializer_class = TLEEntrySerializer

class RiskReportViewSet(viewsets.ModelViewSet):
    queryset = RiskReport.objects.all()
    serializer_class = RiskReportSerializer

