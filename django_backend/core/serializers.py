from rest_framework import serializers
from .models import Satellite, TLEEntry, RiskReport, PredictionReport, User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'email_verified', 'created_at')
        read_only_fields = ('id', 'email_verified', 'created_at')
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

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
