from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class RiskRequest(BaseModel):
    satellite_id: str
    tle: list[str]  # or custom TLE fields

@app.post("/predict-risk")
def predict_risk(data: RiskRequest):
    # Call your ML model here (e.g., LSTM or SVM)
    return {"risk_score": 0.87}
