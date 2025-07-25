from celery import shared_task
import requests
from .models import RiskReport, Satellite

@shared_task
def run_prediction_task(satellite_id_1, satellite_id_2):
    # Send the data to FastAPI for prediction
    response = requests.post("http://localhost:8001/predict", json={
        "sat1_id": satellite_id_1,
        "sat2_id": satellite_id_2,
    })

    result = response.json()

    # Save the result to your Django DB
    from .models import PredictionReport
    PredictionReport.objects.create(
        sat1_id=satellite_id_1,
        sat2_id=satellite_id_2,
        miss_distance=result["miss_distance"],
        probability=result["probability"],
        tca=result["tca"]
    )