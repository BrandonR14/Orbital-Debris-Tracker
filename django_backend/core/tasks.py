from celery import shared_task
import requests
from .models import RiskReport, Satellite, PredictionReport
from datetime import datetime

@shared_task
def run_prediction_task(satellite_id_1, satellite_id_2):
    """Celery task to run orbital collision prediction via FastAPI"""
    try:
        # Send the data to FastAPI for prediction
        response = requests.post("http://localhost:9000/predict", json={
            "sat1_id": satellite_id_1,
            "sat2_id": satellite_id_2,
        }, timeout=30)

        if response.status_code == 200:
            result = response.json()

            # Save the result to Django DB
            report = PredictionReport.objects.create(
                sat1_id=satellite_id_1,
                sat2_id=satellite_id_2,
                miss_distance=result["miss_distance"],
                probability=result["probability"],
                tca=result["tca"]
            )

            return {
                "status": "success",
                "report_id": report.id,
                "miss_distance": result["miss_distance"],
                "probability": result["probability"],
                "tca": result["tca"]
            }
        else:
            error_detail = ""
            try:
                error_detail = response.json().get("detail", response.text)
            except Exception:
                error_detail = response.text
            return {
                "status": "error",
                "message": f"FastAPI returned status {response.status_code}: {error_detail}"
            }
            
    except requests.exceptions.RequestException as e:
        return {
            "status": "error",
            "message": f"Failed to connect to FastAPI: {str(e)}"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Task failed: {str(e)}"
        }