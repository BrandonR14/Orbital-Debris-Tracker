# 🛰️ Orbital Debris Tracker

**Real-time satellite conjunction analysis powered by SGP4 orbital mechanics and machine learning.**

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.2-092E20?style=flat&logo=django&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6-F7931E?style=flat&logo=scikit-learn&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis&logoColor=white)
![Celery](https://img.shields.io/badge/Celery-5.5-37814A?style=flat)

With over 9,000 active satellites in orbit and millions of debris fragments travelling at up to 28,000 km/h, conjunction analysis is one of the most critical challenges in modern space operations. This application lets users select any two tracked objects, trigger a full orbital propagation pipeline, and receive an ML-classified risk assessment — all in under 30 seconds.

---

## ✨ Features

- **Real TLE data** — fetches Two-Line Element sets live from [Space-Track.org](https://www.space-track.org), the official US Space Surveillance Network catalog
- **SGP4 orbital propagation** — propagates both orbits over a 7-day window at 5-minute granularity, then refines to 1-second precision around the Time of Closest Approach (TCA)
- **Collision probability** — 2D Gaussian encounter model with realistic hard-body radius (10 m) and position uncertainty (100 m, 1σ)
- **Random Forest risk classifier** — trained on 15,000 synthetic conjunction events; classifies risk as LOW / MEDIUM / HIGH with per-class confidence scores
- **3D live globe** — WebGL globe showing real-time satellite positions propagated client-side, with animated orbital trail arcs updating every 5 seconds
- **Async task pipeline** — predictions run as Celery tasks via Redis so the UI never blocks; frontend polls for completion
- **Prediction history** — every result is persisted and accessible from a collapsible history view
- **JWT authentication** — secure register/login with automatic silent token refresh

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Browser                         │
│            Next.js 15 / React 19 (:3000)            │
│   3D Globe · Prediction Form · History · Auth UI    │
└───────────────────┬─────────────────────────────────┘
                    │  REST + JWT
                    ▼
┌─────────────────────────────────────────────────────┐
│            Django REST Framework (:8000)             │
│        Auth · User DB · Prediction History           │
└──────────┬───────────────────────────────┬──────────┘
           │ Celery Task                   │ SQLite
           ▼                               ▼
┌─────────────────┐                  ┌──────────┐
│  Redis (:6379)  │                  │ db.sqlite │
│   Task Queue    │                  └──────────┘
└────────┬────────┘
         ▼
┌────────────────────────────────────────────────────┐
│                  Celery Worker                     │
└────────────────────────┬───────────────────────────┘
                         │ HTTP POST /predict
                         ▼
┌────────────────────────────────────────────────────┐
│            FastAPI Microservice (:9000)            │
│                                                    │
│  1. Authenticate with Space-Track.org              │
│  2. Fetch TLE JSON for both satellites             │
│  3. SGP4 propagation  →  find TCA                  │
│  4. Compute collision probability (Gaussian model) │
│  5. Random Forest risk classification              │
└────────────────────────┬───────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  Space-Track.org │
              │  (TLE catalog)   │
              └──────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15, React 19, TypeScript | App Router, server/client components |
| Styling | Tailwind CSS v4 | Utility-first dark-theme UI |
| 3D Globe | react-globe.gl, Three.js | WebGL satellite visualisation |
| Orbital math (client) | satellite.js | Client-side SGP4 for live globe updates |
| Backend API | Django 5.2, Django REST Framework | Auth, data persistence, task dispatch |
| Authentication | djangorestframework-simplejwt | JWT access + refresh tokens with blacklist |
| Task queue | Celery 5.5 + Redis 7 | Async prediction pipeline |
| Prediction engine | FastAPI 0.115, uvicorn | High-performance prediction microservice |
| Orbital mechanics | sgp4 (Python) | Simplified General Perturbations model |
| Machine learning | scikit-learn 1.6 — Random Forest | Conjunction risk classification |
| TLE source | Space-Track.org REST API | Official US SSN satellite catalog |
| Database | SQLite (dev) | User accounts, prediction history |
| Containerisation | Docker Compose | One-command local stack |

---

## 🚀 Quick Start with Docker

> **Requirements:** Docker Desktop · free [Space-Track.org](https://www.space-track.org/auth/createAccount) account

```bash
# 1. Clone
git clone https://github.com/BrandonR14/Orbital-Debris-Tracker.git
cd Orbital-Debris-Tracker

# 2. Configure
cp .env.example .env
#    → set SPACETRACK_USER, SPACETRACK_PASS, and SECRET_KEY in .env

# 3. Start everything
docker compose up --build

# 4. Open
open http://localhost:3000
```

Docker Compose starts Redis, Django (with automatic migrations), the Celery worker, the FastAPI microservice (ML model is trained on first build), and the Next.js frontend.

---

## 🔧 Local Development

<details>
<summary>Expand manual setup instructions</summary>

### Prerequisites
- Python 3.11, Node.js 20+, Redis running on port 6379
- A free [Space-Track.org](https://www.space-track.org/auth/createAccount) account

### 1. Clone & configure
```bash
git clone https://github.com/BrandonR14/Orbital-Debris-Tracker.git
cd Orbital-Debris-Tracker
cp .env.example .env
# Fill in SPACETRACK_USER, SPACETRACK_PASS, SECRET_KEY
```

### 2. Django backend
```bash
cd django_backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver      # http://localhost:8000
```

### 3. Train the ML model & start FastAPI (one-time model training)
```bash
cd fastapi_microservice
pip install -r requirements.txt
python train_model.py           # writes risk_model.joblib
uvicorn main:app --port 9000
```

### 4. Celery worker
```bash
# In django_backend/ with venv active
celery -A django_backend worker --pool=solo --loglevel=info
```

### 5. Frontend
```bash
cd frontend
npm install
npm run dev                     # http://localhost:3000
```

</details>

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key — generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | `True` for local dev, `False` in production |
| `ALLOWED_HOSTS` | Comma-separated — e.g. `localhost,127.0.0.1` |
| `SPACETRACK_USER` | Space-Track.org account email |
| `SPACETRACK_PASS` | Space-Track.org password |
| `REDIS_URL` | Redis connection string — `redis://localhost:6379/0` locally, `redis://redis:6379/0` in Docker |

---

## 🧠 How the Prediction Works

### Step 1 — TLE Acquisition
The FastAPI service authenticates with Space-Track.org and fetches the latest Two-Line Element set for each satellite. TLEs encode orbital elements updated several times daily by the US Space Surveillance Network.

### Step 2 — SGP4 Propagation
Both `Satrec` objects are propagated from now in 5-minute steps over 7 days, producing Earth-Centred Inertial (ECI) position vectors that account for Earth's oblateness, atmospheric drag, and solar radiation pressure.

### Step 3 — TCA Refinement
A fine 1-second resolution search runs in a ±10 minute window around the coarse minimum, finding the exact **Time of Closest Approach** and **miss distance**.

### Step 4 — Collision Probability
A 2D Gaussian encounter model:

```
P = (Ac / 2πσ²) × exp(−d² / 2σ²)
```

`Ac` = combined hard-body cross-section (10 m radius), `σ` = combined position uncertainty (100 m), `d` = miss distance.

### Step 5 — ML Risk Classification
A Random Forest classifier (200 trees, balanced class weights) trained on 15,000 synthetic events predicts LOW / MEDIUM / HIGH from five features:

| Feature | Why it matters |
|---|---|
| Miss distance (km) | Primary proximity metric |
| Relative velocity (km/s) | Hypervelocity impacts are catastrophic even at large cross-sections |
| Average altitude (km) | LEO is far more congested than MEO/GEO |
| Collision probability | Direct risk estimate from Gaussian model |
| Time to TCA (hours) | Urgency — manoeuvre windows close as TCA approaches |

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register/` | — | Register new user |
| `POST` | `/api/auth/login/` | — | Login, returns JWT tokens |
| `POST` | `/api/auth/logout/` | Bearer | Blacklist refresh token |
| `POST` | `/api/auth/refresh/` | — | Refresh access token |
| `POST` | `/api/trigger-prediction/` | Bearer | Start async prediction |
| `GET` | `/api/prediction-status/{task_id}/` | Bearer | Poll Celery task |
| `GET` | `/api/prediction-history/` | Bearer | User's past predictions |
| `GET` | `/api/satellite-tle-data/` | Bearer | TLEs for globe visualisation |

---

## 📁 Project Structure

```
Orbital-Debris-Tracker/
├── django_backend/           # REST API, auth, task dispatch
│   ├── core/
│   │   ├── models.py         # User, Satellite, PredictionReport
│   │   ├── views.py          # API views + TLE cache endpoint
│   │   ├── serializers.py
│   │   └── tasks.py          # Celery task → calls FastAPI
│   ├── django_backend/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── Dockerfile
│   └── entrypoint.sh
├── fastapi_microservice/     # Orbital mechanics + ML engine
│   ├── main.py               # SGP4 · collision probability · RF classifier
│   ├── train_model.py        # Generates risk_model.joblib
│   └── Dockerfile
├── frontend/                 # Next.js application
│   └── src/
│       ├── app/              # Pages: home, login, register, predict, results, history
│       ├── components/       # SatelliteGlobe, SatelliteCombobox, ProtectedRoute
│       ├── lib/              # Satellite catalog, browser shims
│       └── utils/            # JWT auth helpers with silent refresh
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 📸 Screenshots

### Login Page:
*(screenshot — upload to repo assets to display here)*

### Home Page Preview:
*(demo video — too large for GitHub; run locally to see the live globe)*

### Prediction Preview:
*(demo video — too large for GitHub; run locally to see the prediction pipeline)*
---
