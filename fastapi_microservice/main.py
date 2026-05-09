from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from pathlib import Path
import numpy as np
import requests
import os
import logging
import joblib
from sgp4.api import Satrec, jday
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Orbital Debris Prediction API", version="2.0.0")

SPACETRACK_BASE = "https://www.space-track.org"
SPACETRACK_USER = os.getenv("SPACETRACK_USER", "")
SPACETRACK_PASS = os.getenv("SPACETRACK_PASS", "")

# Combined hard-body radius (10 m) and position uncertainty (100 m, 1-sigma)
COMBINED_RADIUS_KM = 0.010
POSITION_UNCERTAINTY_KM = 0.100
EARTH_RADIUS_KM = 6371.0

# ---------------------------------------------------------------------------
# Load the trained risk classifier at startup (run train_model.py first)
# ---------------------------------------------------------------------------
_model_path = Path(__file__).parent / "risk_model.joblib"
if _model_path.exists():
    risk_model = joblib.load(_model_path)
    logger.info("Risk model loaded from %s", _model_path)
else:
    risk_model = None
    logger.warning("risk_model.joblib not found — ML risk classification disabled. Run train_model.py.")

ML_FEATURES = [
    "miss_distance",
    "relative_velocity",
    "altitude",
    "collision_probability",
    "time_to_tca_hours",
]


class PredictionRequest(BaseModel):
    sat1_id: int
    sat2_id: int


# ---------------------------------------------------------------------------
# Space-Track helpers
# ---------------------------------------------------------------------------

def get_spacetrack_session() -> requests.Session:
    session = requests.Session()
    resp = session.post(
        f"{SPACETRACK_BASE}/ajaxauth/login",
        data={"identity": SPACETRACK_USER, "password": SPACETRACK_PASS},
        timeout=15,
    )
    resp.raise_for_status()
    logger.info("Space-Track login response: %s", resp.text[:200])
    if "Failed" in resp.text or "failed" in resp.text:
        raise ValueError(f"Space-Track login failed — check credentials. Response: {resp.text[:200]}")
    return session


def fetch_satellite_data(session: requests.Session, norad_id: int) -> tuple[str, str, str]:
    """Return (satellite_name, tle_line1, tle_line2) from Space-Track."""
    url = (
        f"{SPACETRACK_BASE}/basicspacedata/query"
        f"/class/gp/NORAD_CAT_ID/{norad_id}"
        f"/orderby/EPOCH desc/limit/1/format/json"
    )
    resp = session.get(url, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    if not data:
        raise ValueError(f"No data found for NORAD ID {norad_id}. It may have decayed or does not exist.")
    obj = data[0]
    name = obj.get("OBJECT_NAME", f"NORAD-{norad_id}")
    line1 = obj.get("TLE_LINE1", "")
    line2 = obj.get("TLE_LINE2", "")
    if not line1 or not line2:
        raise ValueError(f"TLE lines missing for NORAD ID {norad_id}.")
    return name, line1, line2


# ---------------------------------------------------------------------------
# SGP4 propagation helpers
# ---------------------------------------------------------------------------

def propagate(
    sat: Satrec, start: datetime, end: datetime, step_s: int
) -> list[tuple[datetime, np.ndarray]]:
    """Return (utc_time, position_km_ECI) pairs. Skips time steps with SGP4 errors."""
    results = []
    t = start
    while t <= end:
        jd, fr = jday(t.year, t.month, t.day, t.hour, t.minute, t.second + t.microsecond / 1e6)
        err, r, _ = sat.sgp4(jd, fr)
        if err == 0:
            results.append((t, np.array(r)))
        t += timedelta(seconds=step_s)
    return results


def closest_approach(
    pos1: list[tuple[datetime, np.ndarray]],
    pos2: list[tuple[datetime, np.ndarray]],
) -> tuple[float, datetime]:
    """Return (miss_distance_km, time_of_closest_approach)."""
    min_dist = float("inf")
    tca = pos1[0][0]
    for (t, r1), (_, r2) in zip(pos1, pos2):
        d = float(np.linalg.norm(r1 - r2))
        if d < min_dist:
            min_dist = d
            tca = t
    return min_dist, tca


def state_at(sat: Satrec, t: datetime) -> tuple[np.ndarray, np.ndarray]:
    """Return (position_km, velocity_km_s) in ECI at time t."""
    jd, fr = jday(t.year, t.month, t.day, t.hour, t.minute, t.second + t.microsecond / 1e6)
    _, r, v = sat.sgp4(jd, fr)
    return np.array(r), np.array(v)


# ---------------------------------------------------------------------------
# Physics helpers
# ---------------------------------------------------------------------------

def collision_probability(miss_distance_km: float) -> float:
    """2D Gaussian approximation in the encounter plane."""
    A_c = np.pi * COMBINED_RADIUS_KM ** 2
    sigma = POSITION_UNCERTAINTY_KM
    p = (A_c / (2 * np.pi * sigma ** 2)) * np.exp(-(miss_distance_km ** 2) / (2 * sigma ** 2))
    return float(min(p, 1.0))


def ml_risk_label(
    miss_dist: float,
    rel_velocity: float,
    altitude: float,
    prob: float,
    time_to_tca_hours: float,
) -> dict:
    """
    Run the trained Random Forest classifier.
    Returns {"label": str, "probabilities": {"LOW": float, "MEDIUM": float, "HIGH": float}}
    Falls back to threshold-based label if the model is not loaded.
    """
    if risk_model is None:
        # Fallback: simple threshold logic (no ML model loaded)
        if miss_dist < 0.2 or prob > 1e-3:
            label = "HIGH"
        elif miss_dist < 1.0 or prob > 1e-4:
            label = "MEDIUM"
        else:
            label = "LOW"
        return {"label": label, "probabilities": None, "model": "threshold_fallback"}

    features = np.array([[miss_dist, rel_velocity, altitude, prob, time_to_tca_hours]])
    label = risk_model.predict(features)[0]
    proba = risk_model.predict_proba(features)[0]
    classes = risk_model.classes_
    return {
        "label": label,
        "probabilities": {cls: round(float(p), 4) for cls, p in zip(classes, proba)},
        "model": "random_forest",
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def read_root():
    return {
        "message": "Orbital Debris Prediction API",
        "version": "2.0.0",
        "status": "running",
        "ml_model_loaded": risk_model is not None,
    }


@app.post("/predict")
def predict(data: PredictionRequest):
    if not SPACETRACK_USER or not SPACETRACK_PASS:
        raise HTTPException(
            status_code=500,
            detail="SPACETRACK_USER and SPACETRACK_PASS environment variables are not set.",
        )

    # --- Fetch TLEs from Space-Track ---
    try:
        session = get_spacetrack_session()
    except (requests.RequestException, ValueError) as e:
        logger.error("Space-Track auth error: %s", e)
        raise HTTPException(status_code=502, detail=f"Space-Track authentication failed: {e}")

    try:
        sat1_name, line1_1, line2_1 = fetch_satellite_data(session, data.sat1_id)
        logger.info("Fetched sat1 (%s): %s", data.sat1_id, sat1_name)
        sat2_name, line1_2, line2_2 = fetch_satellite_data(session, data.sat2_id)
        logger.info("Fetched sat2 (%s): %s", data.sat2_id, sat2_name)
    except ValueError as e:
        logger.error("Satellite not found: %s", e)
        raise HTTPException(status_code=404, detail=str(e))
    except requests.RequestException as e:
        logger.error("Space-Track fetch error: %s", e)
        raise HTTPException(status_code=502, detail=f"Space-Track TLE fetch failed: {e}")

    # --- Parse TLEs ---
    try:
        sat1 = Satrec.twoline2rv(line1_1, line2_1)
        sat2 = Satrec.twoline2rv(line1_2, line2_2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TLE parse error: {e}")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    end = now + timedelta(days=7)

    # --- Coarse pass: 5-minute steps over 7 days (2016 steps per satellite) ---
    pos1_coarse = propagate(sat1, now, end, step_s=300)
    pos2_coarse = propagate(sat2, now, end, step_s=300)

    if not pos1_coarse or not pos2_coarse:
        raise HTTPException(
            status_code=500,
            detail="SGP4 propagation produced no results — one or both satellites may have decayed.",
        )

    _, tca_coarse = closest_approach(pos1_coarse, pos2_coarse)

    # --- Fine pass: 1-second steps in ±10 min window around coarse TCA ---
    fine_start = tca_coarse - timedelta(minutes=10)
    fine_end = tca_coarse + timedelta(minutes=10)
    pos1_fine = propagate(sat1, fine_start, fine_end, step_s=1)
    pos2_fine = propagate(sat2, fine_start, fine_end, step_s=1)
    miss_dist_km, tca_fine = closest_approach(pos1_fine, pos2_fine)

    # --- Derive features for ML classifier ---
    r1, v1 = state_at(sat1, tca_fine)
    r2, v2 = state_at(sat2, tca_fine)
    relative_velocity = float(np.linalg.norm(v1 - v2))                          # km/s
    avg_altitude = (float(np.linalg.norm(r1)) + float(np.linalg.norm(r2))) / 2 - EARTH_RADIUS_KM  # km
    time_to_tca_hours = (tca_fine - now).total_seconds() / 3600.0

    prob = collision_probability(miss_dist_km)
    risk = ml_risk_label(miss_dist_km, relative_velocity, avg_altitude, prob, time_to_tca_hours)

    tca_utc = tca_fine.replace(tzinfo=timezone.utc)

    return {
        "sat1_id": data.sat1_id,
        "sat2_id": data.sat2_id,
        "sat1_name": sat1_name,
        "sat2_name": sat2_name,
        "miss_distance": round(miss_dist_km, 4),
        "probability": round(prob, 10),
        "tca": tca_utc.isoformat().replace("+00:00", "Z"),
        "relative_velocity_km_s": round(relative_velocity, 4),
        "avg_altitude_km": round(avg_altitude, 2),
        "time_to_tca_hours": round(time_to_tca_hours, 2),
        "risk": risk,
        "prediction_time": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "ml_model_loaded": risk_model is not None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
