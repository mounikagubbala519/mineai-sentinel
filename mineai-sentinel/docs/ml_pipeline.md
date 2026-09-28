# Machine Learning Pipeline Documentation — MineAI Sentinel

This document describes the design, feature engineering, out-of-sample evaluation, and inference pipelines for the 3 machine learning models in MineAI Sentinel.

---

## 1. Reserve Estimation Model

- **Objective**: Multi-output regression to predict total ore body tonnage (`est_tonnage_mt`) and manganese grade (`est_mn_grade_pct`).
- **Input Features**: `depth_m`, `rock_density_gt_m3`, `drill_hole_density`, `elevation_m`, `soil_moisture_pct`, `ndvi_index`, `lst_temp_c`, `annual_rainfall_mm`.
- **Model Comparison**: `RandomForestRegressor` vs `GradientBoostingRegressor`.
- **Selected Model**: `RandomForestRegressor` (selected automatically based on test MAE).
- **Out-of-Sample Metrics**:
  - MAE: 531.25 MT
  - RMSE: 578.90 MT
  - R²: 0.5416

---

## 2. Production Forecasting Model

- **Objective**: Predict daily ore production tonnage (`actual_production_tonnes`) and horizon outputs (1-day, 7-day, 30-day).
- **Feature Engineering**: Chronological lag features:
  - `lag_1d`: Production 1 day prior.
  - `lag_7d`: Production 7 days prior.
  - `rolling_7d_mean`: 7-day moving average.
  - `lag_30d_mean`: 30-day moving average.
- **Data Splitting**: Chronological train/test split (first 80% train, last 20% test) to eliminate time-series data leakage.
- **Model**: `GradientBoostingRegressor` (120 estimators, learning rate 0.08).
- **Out-of-Sample Metrics**:
  - MAE: 54.45 tpd
  - RMSE: 71.30 tpd
  - R²: 0.9672

---

## 3. Shortfall Risk Classification Model

- **Objective**: Multi-class risk rating (`LOW`, `MEDIUM`, `HIGH`) and shortfall probability calculation.
- **Model Comparison**: `RandomForestClassifier` vs `HistGradientBoostingClassifier`.
- **Selected Model**: `HistGradientBoostingClassifier`.
- **Out-of-Sample Metrics**:
  - Validation Accuracy: 95.74%
  - Weighted Precision: 95.20%
  - Weighted Recall: 95.74%
  - Weighted F1 Score: 0.9464
  - ROC-AUC (OVR): 0.9894

---

## 4. Model Artifact Persistence

All trained models are serialized using `joblib` and saved to `backend/ml/saved_models/`:
- `reserve_model.joblib`
- `production_model.joblib`
- `shortfall_model.joblib`
- `metrics.json`
