from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid

class User(AbstractUser):
    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(default=False)
    verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

class Satellite(models.Model):
    name = models.CharField(max_length=100)
    norad_id = models.IntegerField(unique=True)
    intl_designator = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.norad_id})"

class TLEEntry(models.Model):
    satellite = models.ForeignKey(Satellite, on_delete=models.CASCADE, related_name='tle_entries')
    line1 = models.CharField(max_length=100)
    line2 = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"TLE for {self.satellite.name} at {self.timestamp}"

class RiskReport(models.Model):
    satellite_1 = models.ForeignKey(Satellite, on_delete=models.CASCADE, related_name='risk_as_sat1')
    satellite_2 = models.ForeignKey(Satellite, on_delete=models.CASCADE, related_name='risk_as_sat2')
    predicted_at = models.DateTimeField(auto_now_add=True)
    time_of_closest_approach = models.DateTimeField()
    miss_distance_km = models.FloatField()
    collision_probability = models.FloatField()

    def __str__(self):
        return f"Risk between {self.satellite_1} and {self.satellite_2} on {self.time_of_closest_approach}"
    

class PredictionReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='predictions')
    sat1_id = models.CharField(max_length=255)
    sat2_id = models.CharField(max_length=255)
    sat1_name = models.CharField(max_length=100, blank=True, default='')
    sat2_name = models.CharField(max_length=100, blank=True, default='')
    miss_distance = models.FloatField()
    probability = models.FloatField()
    tca = models.DateTimeField()
    relative_velocity = models.FloatField(null=True, blank=True)
    avg_altitude = models.FloatField(null=True, blank=True)
    time_to_tca_hours = models.FloatField(null=True, blank=True)
    risk_label = models.CharField(max_length=10, blank=True, default='')
    risk_probabilities = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sat1_name or self.sat1_id} vs {self.sat2_name or self.sat2_id} — {self.risk_label}"

