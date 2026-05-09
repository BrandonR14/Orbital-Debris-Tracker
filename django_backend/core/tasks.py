from celery import shared_task
import requests
from .models import PredictionReport
from django.contrib.auth import get_user_model

User = get_user_model()


@shared_task
def run_prediction_task(satellite_id_1, satellite_id_2, user_id=None):
    """Celery task to run orbital collision prediction via FastAPI."""
    try:
        response = requests.post("http://localhost:9000/predict", json={
            "sat1_id": satellite_id_1,
            "sat2_id": satellite_id_2,
        }, timeout=120)

        if response.status_code == 200:
            result = response.json()
            risk = result.get("risk", {})

            user = None
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                except User.DoesNotExist:
                    pass

            report = PredictionReport.objects.create(
                user=user,
                sat1_id=str(satellite_id_1),
                sat2_id=str(satellite_id_2),
                sat1_name=result.get("sat1_name", ""),
                sat2_name=result.get("sat2_name", ""),
                miss_distance=result["miss_distance"],
                probability=result["probability"],
                tca=result["tca"],
                relative_velocity=result.get("relative_velocity_km_s"),
                avg_altitude=result.get("avg_altitude_km"),
                time_to_tca_hours=result.get("time_to_tca_hours"),
                risk_label=risk.get("label", ""),
                risk_probabilities=risk.get("probabilities"),
            )

            return {
                "status": "success",
                "report_id": report.id,
                "sat1_id": satellite_id_1,
                "sat2_id": satellite_id_2,
                "sat1_name": result.get("sat1_name", ""),
                "sat2_name": result.get("sat2_name", ""),
                "miss_distance": result["miss_distance"],
                "probability": result["probability"],
                "tca": result["tca"],
                "relative_velocity": result.get("relative_velocity_km_s"),
                "avg_altitude": result.get("avg_altitude_km"),
                "time_to_tca_hours": result.get("time_to_tca_hours"),
                "risk_label": risk.get("label", ""),
                "risk_probabilities": risk.get("probabilities"),
            }
        else:
            error_detail = ""
            try:
                error_detail = response.json().get("detail", response.text)
            except Exception:
                error_detail = response.text
            return {
                "status": "error",
                "message": f"FastAPI returned status {response.status_code}: {error_detail}",
            }

    except requests.exceptions.RequestException as e:
        return {"status": "error", "message": f"Failed to connect to FastAPI: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": f"Task failed: {str(e)}"}
