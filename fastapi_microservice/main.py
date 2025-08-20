from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
import random

app = FastAPI(title="Orbital Debris Prediction API", version="1.0.0")

class SatelliteInput(BaseModel):
    norad_id: int

class PredictionInput(BaseModel):
    satellite_1: SatelliteInput
    satellite_2: SatelliteInput

class PredictionRequest(BaseModel):
    sat1_id: int
    sat2_id: int

@app.get("/")
def read_root():
    return {"message": "Orbital Debris Prediction API", "status": "running"}

@app.post("/predict")
def predict(data: PredictionRequest):
    """Simulate orbital collision prediction"""
    try:
        # Simulate processing time
        import time
        time.sleep(2)  # Simulate computation time
        
        # Generate realistic prediction data
        miss_distance = random.uniform(50, 500)  # km
        probability = random.uniform(0.000001, 0.01)  # 0.0001% to 1%
        
        # Generate TCA (Time of Closest Approach) in the next 24-72 hours
        hours_ahead = random.uniform(24, 72)
        tca = datetime.utcnow() + timedelta(hours=hours_ahead)
        
        return {
            "miss_distance": round(miss_distance, 2),
            "probability": round(probability, 8),
            "tca": tca.isoformat() + "Z",
            "sat1_id": data.sat1_id,
            "sat2_id": data.sat2_id,
            "prediction_time": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
