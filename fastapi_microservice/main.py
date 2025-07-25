from fastapi import FastAPI, Request
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

class SatelliteInput(BaseModel):
    norad_id: int

class PredictionInput(BaseModel):
    satellite_1: SatelliteInput
    satellite_2: SatelliteInput

class PredictionRequest(BaseModel):
    sat1_id: int
    sat2_id: int
@app.post("/predict")
def predict(data: PredictionRequest):
    # Simulate a prediction
    return {
        "miss_distance": 120.5,
        "probability": 0.0000045,
        "tca": "2025-08-01T10:30:00Z"
    }
