from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import numpy as np
import requests
import os
import logging
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


class PredictionRequest(BaseModel):
    sat1_id: int
    sat2_id: int


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


def fetch_tle(session: requests.Session, norad_id: int) -> tuple[str, str]:
    url = (
        f"{SPACETRACK_BASE}/basicspacedata/query"
        f"/class/gp/NORAD_CAT_ID/{norad_id}"
        f"/orderby/EPOCH desc/limit/1/format/tle"
    )
    resp = session.get(url, timeout=15)
    resp.raise_for_status()
    lines = [line.strip() for line in resp.text.strip().splitlines() if line.strip()]
    if len(lines) < 2:
        raise ValueError(f"No TLE data found for NORAD ID {norad_id}. It may have decayed or does not exist.")
    return lines[0], lines[1]


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


def collision_probability(miss_distance_km: float) -> float:
    """
    Simplified 2D Gaussian collision probability in the encounter plane.
    Assumes isotropic position uncertainty and a circular combined cross-section.
    """
    A_c = np.pi * COMBINED_RADIUS_KM ** 2
    sigma = POSITION_UNCERTAINTY_KM
    p = (A_c / (2 * np.pi * sigma ** 2)) * np.exp(-(miss_distance_km ** 2) / (2 * sigma ** 2))
    return float(min(p, 1.0))


@app.get("/")
def read_root():
    return {"message": "Orbital Debris Prediction API", "version": "2.0.0", "status": "running"}


@app.post("/predict")
def predict(data: PredictionRequest):
    if not SPACETRACK_USER or not SPACETRACK_PASS:
        raise HTTPException(
            status_code=500,
            detail="SPACETRACK_USER and SPACETRACK_PASS environment variables are not set.",
        )

    try:
        session = get_spacetrack_session()
    except (requests.RequestException, ValueError) as e:
        logger.error("Space-Track auth error: %s", e)
        raise HTTPException(status_code=502, detail=f"Space-Track authentication failed: {e}")

    try:
        line1_1, line2_1 = fetch_tle(session, data.sat1_id)
        logger.info("Fetched TLE for sat1 (%s): %s | %s", data.sat1_id, line1_1, line2_1)
        line1_2, line2_2 = fetch_tle(session, data.sat2_id)
        logger.info("Fetched TLE for sat2 (%s): %s | %s", data.sat2_id, line1_2, line2_2)
    except ValueError as e:
        logger.error("TLE not found: %s", e)
        raise HTTPException(status_code=404, detail=str(e))
    except requests.RequestException as e:
        logger.error("Space-Track TLE fetch error: %s", e)
        raise HTTPException(status_code=502, detail=f"Space-Track TLE fetch failed: {e}")

    try:
        sat1 = Satrec.twoline2rv(line1_1, line2_1)
        sat2 = Satrec.twoline2rv(line1_2, line2_2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TLE parse error: {e}")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    end = now + timedelta(days=7)

    # Coarse pass: 5-minute steps over 7 days (2016 steps per satellite)
    pos1_coarse = propagate(sat1, now, end, step_s=300)
    pos2_coarse = propagate(sat2, now, end, step_s=300)

    if not pos1_coarse or not pos2_coarse:
        raise HTTPException(
            status_code=500,
            detail="SGP4 propagation produced no results — one or both satellites may have decayed.",
        )

    _, tca_coarse = closest_approach(pos1_coarse, pos2_coarse)

    # Fine pass: 1-second steps in ±10 min window around the coarse TCA
    fine_start = tca_coarse - timedelta(minutes=10)
    fine_end = tca_coarse + timedelta(minutes=10)
    pos1_fine = propagate(sat1, fine_start, fine_end, step_s=1)
    pos2_fine = propagate(sat2, fine_start, fine_end, step_s=1)
    miss_dist_km, tca_fine = closest_approach(pos1_fine, pos2_fine)

    prob = collision_probability(miss_dist_km)
    tca_utc = tca_fine.replace(tzinfo=timezone.utc)

    return {
        "sat1_id": data.sat1_id,
        "sat2_id": data.sat2_id,
        "miss_distance": round(miss_dist_km, 4),
        "probability": round(prob, 10),
        "tca": tca_utc.isoformat().replace("+00:00", "Z"),
        "prediction_time": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}
