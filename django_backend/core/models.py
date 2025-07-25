from django.db import models

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
    sat1_id = models.CharField(max_length=255)
    sat2_id = models.CharField(max_length=255)
    miss_distance = models.FloatField()
    probability = models.FloatField()
    tca = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

