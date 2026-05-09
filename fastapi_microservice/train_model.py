"""
Train a Random Forest risk classifier on synthetic conjunction event data.
Run this script once before starting the FastAPI service:
    python train_model.py
"""

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

np.random.seed(42)
N = 15000

# ---------------------------------------------------------------------------
# 1. Generate synthetic conjunction events
# ---------------------------------------------------------------------------

# Most real conjunction events have large miss distances — exponential fits well
miss_distance = np.random.exponential(scale=40, size=N)
miss_distance = np.clip(miss_distance, 0.001, 500)

# Orbit regime mix: 75% LEO, 15% MEO, 10% GEO (reflects real catalog)
orbit_type = np.random.choice(["LEO", "MEO", "GEO"], size=N, p=[0.75, 0.15, 0.10])
altitude = np.where(
    orbit_type == "LEO", np.random.uniform(200, 2000, N),
    np.where(orbit_type == "MEO", np.random.uniform(2000, 20000, N),
             np.random.uniform(35500, 36000, N))
)

# Relative velocity at TCA — LEO objects cross each other at up to 15 km/s
relative_velocity = np.where(
    orbit_type == "LEO", np.random.uniform(0.1, 15.0, N),
    np.where(orbit_type == "MEO", np.random.uniform(0.1, 5.0, N),
             np.random.uniform(0.0, 1.0, N))
)

# How far in the future the TCA is (0.5–168 hours / 7 days)
time_to_tca = np.random.uniform(0.5, 168.0, N)

# ---------------------------------------------------------------------------
# 2. Compute Gaussian collision probability (same formula used in main.py)
# ---------------------------------------------------------------------------
COMBINED_RADIUS_KM = 0.010       # 10 m combined hard-body radius
POSITION_UNCERTAINTY_KM = 0.100  # 100 m 1-sigma position uncertainty
A_c = np.pi * COMBINED_RADIUS_KM ** 2
sigma = POSITION_UNCERTAINTY_KM
collision_prob = (A_c / (2 * np.pi * sigma ** 2)) * np.exp(
    -(miss_distance ** 2) / (2 * sigma ** 2)
)
collision_prob = np.clip(collision_prob, 0, 1)

# ---------------------------------------------------------------------------
# 3. Label each event using physics-informed thresholds
#
# Two modifiers add nuance beyond a simple miss-distance cutoff:
#   - Velocity factor: impacts above the Whipple shield threshold (~3 km/s)
#     are hypervelocity events that shatter objects into thousands of debris
#     fragments — qualitatively more dangerous at the same miss distance.
#   - Time urgency factor: a TCA < 24 hours away leaves little time for a
#     maneuver decision, so we treat it as higher risk.
# ---------------------------------------------------------------------------
vel_factor = np.where(relative_velocity > 3.0, 1.5, 1.0)
time_factor = np.where(time_to_tca < 24.0, 1.5, 1.0)

adjusted_distance = miss_distance / (vel_factor * time_factor)
adjusted_prob = collision_prob * vel_factor * time_factor

risk_label = np.where(
    (adjusted_distance < 0.2) | (adjusted_prob > 1e-3), "HIGH",
    np.where(
        (adjusted_distance < 1.0) | (adjusted_prob > 1e-4), "MEDIUM",
        "LOW"
    )
)

# ---------------------------------------------------------------------------
# 4. Build DataFrame and report class balance
# ---------------------------------------------------------------------------
df = pd.DataFrame({
    "miss_distance":        miss_distance,
    "relative_velocity":    relative_velocity,
    "altitude":             altitude,
    "collision_probability": collision_prob,
    "time_to_tca_hours":    time_to_tca,
    "risk_label":           risk_label,
})

print("=== Label distribution ===")
print(df["risk_label"].value_counts())
print()

# ---------------------------------------------------------------------------
# 5. Train Random Forest
# ---------------------------------------------------------------------------
FEATURES = [
    "miss_distance",
    "relative_velocity",
    "altitude",
    "collision_probability",
    "time_to_tca_hours",
]

X = df[FEATURES]
y = df["risk_label"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_leaf=5,
    class_weight="balanced",   # compensates for class imbalance (many LOW events)
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)

# ---------------------------------------------------------------------------
# 6. Evaluate and report
# ---------------------------------------------------------------------------
y_pred = model.predict(X_test)
print(f"=== Test accuracy: {accuracy_score(y_test, y_pred):.4f} ===\n")
print(classification_report(y_test, y_pred))

print("=== Feature importances ===")
for feat, imp in sorted(zip(FEATURES, model.feature_importances_), key=lambda x: -x[1]):
    print(f"  {feat:<28} {imp:.4f}")
print()

# ---------------------------------------------------------------------------
# 7. Save model next to this script
# ---------------------------------------------------------------------------
model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "risk_model.joblib")
joblib.dump(model, model_path)
print(f"Model saved to: {model_path}")
