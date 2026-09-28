"""
FastAPI Endpoints for MineAI Sentinel
Provides complete REST API interface for frontend & client integration.
"""
from fastapi import APIRouter, HTTPException
import json
import os
import pandas as pd
from typing import Dict, Any, List, Optional

from app.core.config import settings
from app.core.data_provider import get_data_provider
from app.models.pydantic_schemas import (
    ReservePredictRequest, ReservePredictResponse,
    ForecastPredictRequest, ForecastPredictResponse,
    ShortfallPredictRequest, ShortfallPredictResponse,
    WhatIfRequest, WhatIfResponse,
    OperationalRiskResponse, RecommendationResponse,
    AlertSchema, AlertSummaryResponse, AlertThresholdsConfig
)
from app.services.risk_engine import risk_engine_service
from app.services.recommendation_engine import recommendation_service
from app.services.simulator import simulator_service
from app.services.alert_engine import alert_engine_service
from ml.predictor import PredictorService

router = APIRouter()
data_provider = get_data_provider()

# Predictor Service initialization
_predictor = PredictorService()

def get_predictor():
    return _predictor

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "demo_mode": settings.DEMO_MODE,
        "data_provider": data_provider.__class__.__name__
    }

@router.get("/dashboard/summary")
def get_dashboard_summary():
    blocks_df = data_provider.get_block_data()
    prod_df = data_provider.get_production_data()
    eq_df = data_provider.get_equipment_data()
    env_df = data_provider.get_environmental_data()
    
    total_est_res = float(blocks_df["est_tonnage_mt"].sum())
    total_rec_res = float(blocks_df["recoverable_tonnage_mt"].sum())
    
    recent_prod = prod_df.sort_values("date").tail(15)
    current_prod = float(recent_prod["actual_production_tonnes"].mean())
    monthly_target = float(recent_prod["target_production_tonnes"].mean())
    
    forecast_prod = current_prod * 0.94
    production_gap = max(0.0, monthly_target - forecast_prod)
    
    avg_eq_avail = float(eq_df["availability_pct"].mean())
    avg_env_risk = float(env_df.tail(15)["environmental_risk_score"].mean())
    
    # Risk calculation
    risk_data = risk_engine_service.calculate_operational_risk(
        equipment_downtime_hrs=float(eq_df["downtime_hours_month"].mean() / 10.0),
        rainfall_mm=float(env_df.tail(1)["rainfall_mm"].values[0]),
        equipment_availability_pct=avg_eq_avail
    )
    
    # Dynamic active alerts from Alert Engine
    active_summary = alert_engine_service.get_active_alerts()
    alerts = active_summary["alerts"]

    sf_res = get_predictor().predict_shortfall_risk(
        target_prod=monthly_target,
        actual_expected=forecast_prod,
        maint_delay=float(eq_df["downtime_hours_month"].mean() / 30.0),
        blasting_delay=1.5,
        rainfall_mm=float(env_df.tail(1)["rainfall_mm"].values[0]),
        active_machines=8,
        operating_hours=16.0
    )
    shortfall_prob = sf_res["shortfall_probability_pct"]
    
    return {
        "demo_mode": settings.DEMO_MODE,
        "demo_badge": "Demo Mode — Synthetic Dataset",
        "total_estimated_reserves_mt": round(total_est_res, 1),
        "recoverable_reserves_mt": round(total_rec_res, 1),
        "current_daily_production_tonnes": round(current_prod, 1),
        "target_daily_production_tonnes": round(monthly_target, 1),
        "forecasted_daily_production_tonnes": round(forecast_prod, 1),
        "production_gap_tonnes": round(production_gap, 1),
        "shortfall_probability_pct": shortfall_prob,
        "equipment_availability_pct": round(avg_eq_avail, 1),
        "environmental_risk_score": round(avg_env_risk, 1),
        "overall_risk_score": risk_data["overall_risk_score"],
        "overall_risk_level": risk_data["risk_level"],
        "active_alerts": alerts
    }

@router.get("/reserves")
def get_reserves():
    df = data_provider.get_block_data()
    return {
        "count": len(df),
        "blocks": df.to_dict(orient="records")
    }

@router.get("/reserves/map")
def get_reserves_map():
    df = data_provider.get_block_data()
    features = []
    
    for _, row in df.iterrows():
        # Determine risk color based on depth & grade
        if row["depth_m"] > 200 or row["est_mn_grade_pct"] < 32.0:
            risk = "HIGH"
            priority = "PRIORITY_3"
        elif row["depth_m"] > 120 or row["est_mn_grade_pct"] < 38.0:
            risk = "MEDIUM"
            priority = "PRIORITY_2"
        else:
            risk = "LOW"
            priority = "PRIORITY_1"
            
        features.append({
            "type": "Feature",
            "properties": {
                "block_id": row["block_id"],
                "block_name": row["block_name"],
                "elevation_m": row["elevation_m"],
                "depth_m": row["depth_m"],
                "est_tonnage_mt": row["est_tonnage_mt"],
                "recoverable_tonnage_mt": row["recoverable_tonnage_mt"],
                "est_mn_grade_pct": row["est_mn_grade_pct"],
                "risk_level": risk,
                "production_priority": priority
            },
            "geometry": {
                "type": "Point",
                "coordinates": [row["longitude"], row["latitude"]]
            }
        })
        
    return {
        "type": "FeatureCollection",
        "demo_disclaimer": "Synthetic demonstration coordinates — not actual MOIL operational coordinates.",
        "features": features
    }

@router.post("/reserves/predict", response_model=ReservePredictResponse)
def predict_reserve(req: ReservePredictRequest):
    try:
        predictor = get_predictor()
        res = predictor.predict_reserve(
            depth_m=req.depth_m,
            rock_density=req.rock_density_gt_m3,
            drill_density=req.drill_hole_density,
            elevation_m=req.elevation_m,
            soil_moisture=req.soil_moisture_pct,
            ndvi=req.ndvi_index,
            lst_temp=req.lst_temp_c,
            annual_rainfall=req.annual_rainfall_mm
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/production/history")
def get_production_history():
    df = data_provider.get_production_data()
    # Group by date for total daily production chart
    daily_agg = df.groupby("date").agg({
        "target_production_tonnes": "sum",
        "actual_production_tonnes": "sum",
        "blasting_delay_hours": "mean",
        "maintenance_delay_hours": "mean",
        "rainfall_mm": "mean"
    }).reset_index().tail(60)
    
    return {
        "days": len(daily_agg),
        "history": daily_agg.to_dict(orient="records")
    }

@router.get("/production/forecast")
def get_production_forecast():
    predictor = get_predictor()
    res = predictor.predict_production(
        target_prod=1800.0,
        operating_hours=18.0,
        active_machines=10,
        blasting_delay=1.5,
        maint_delay=2.0,
        rainfall_mm=15.0
    )
    return res

@router.post("/production/forecast", response_model=ForecastPredictResponse)
def post_production_forecast(req: ForecastPredictRequest):
    predictor = get_predictor()
    res = predictor.predict_production(
        target_prod=req.target_production_tonnes,
        operating_hours=req.operating_hours,
        active_machines=req.active_machines_count,
        blasting_delay=req.blasting_delay_hours,
        maint_delay=req.maintenance_delay_hours,
        rainfall_mm=req.rainfall_mm,
        temp_c=req.temperature_c,
        avg_mn_grade=req.avg_mn_grade_mined
    )
    return res

@router.post("/shortfall/predict", response_model=ShortfallPredictResponse)
def predict_shortfall(req: ShortfallPredictRequest):
    predictor = get_predictor()
    res = predictor.predict_shortfall_risk(
        target_prod=req.target_production_tonnes,
        actual_expected=req.actual_expected_tonnes,
        maint_delay=req.maintenance_delay_hours,
        blasting_delay=req.blasting_delay_hours,
        rainfall_mm=req.rainfall_mm,
        active_machines=req.active_machines_count,
        operating_hours=req.operating_hours
    )
    return res

@router.get("/equipment")
def get_equipment():
    df = data_provider.get_equipment_data()
    return {
        "total_count": len(df),
        "equipment": df.to_dict(orient="records")
    }

@router.get("/equipment/risks")
def get_equipment_risks():
    df = data_provider.get_equipment_data()
    high_risk = df[df["downtime_risk"] == "HIGH"].to_dict(orient="records")
    med_risk = df[df["downtime_risk"] == "MEDIUM"].to_dict(orient="records")
    
    return {
        "high_risk_count": len(high_risk),
        "medium_risk_count": len(med_risk),
        "high_risk_assets": high_risk,
        "medium_risk_assets": med_risk
    }

@router.get("/environment")
def get_environment():
    df = data_provider.get_environmental_data()
    recent = df.sort_values("date").tail(30)
    return {
        "recent_records": len(recent),
        "environmental_telemetry": recent.to_dict(orient="records")
    }

@router.get("/risks", response_model=OperationalRiskResponse)
def get_risks():
    eq_df = data_provider.get_equipment_data()
    env_df = data_provider.get_environmental_data()
    
    res = risk_engine_service.calculate_operational_risk(
        equipment_downtime_hrs=float(eq_df["downtime_hours_month"].mean() / 10.0),
        rainfall_mm=float(env_df.tail(1)["rainfall_mm"].values[0]),
        equipment_availability_pct=float(eq_df["availability_pct"].mean())
    )
    return res

@router.get("/recommendations", response_model=RecommendationResponse)
def get_recommendations():
    eq_df = data_provider.get_equipment_data()
    env_df = data_provider.get_environmental_data()
    
    avg_dt = float(eq_df["downtime_hours_month"].mean() / 10.0)
    latest_rain = float(env_df.tail(1)["rainfall_mm"].values[0])
    
    risk_data = risk_engine_service.calculate_operational_risk(
        equipment_downtime_hrs=avg_dt,
        rainfall_mm=latest_rain
    )
    
    res = recommendation_service.generate_recommendations(
        risk_data=risk_data,
        equipment_downtime_hrs=avg_dt,
        rainfall_mm=latest_rain
    )
    return res

@router.post("/what-if", response_model=WhatIfResponse)
def simulate_what_if(req: WhatIfRequest):
    res = simulator_service.simulate_scenario(
        equipment_avail=req.equipment_availability_pct,
        downtime_hrs=req.downtime_hours,
        rainfall_mm=req.rainfall_mm,
        blasting_delay=req.blasting_delay_hours,
        working_hrs=req.working_hours,
        target_prod=req.production_target_tonnes,
        active_machines=req.active_machines_count
    )
    return res

@router.get("/model/metrics")
def get_model_metrics():
    metrics_path = os.path.join(settings.SAVED_MODELS_DIR, "metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            metrics = json.load(f)
    else:
        metrics = {"status": "Metrics not found. Train models first."}
        
    return {
        "disclaimer": "Metrics are calculated using the prototype synthetic dataset and do not represent real-world MOIL performance.",
        "metrics": metrics
    }

# =====================================================================
# ALERT & EARLY WARNING SYSTEM ENDPOINTS
# =====================================================================

@router.get("/alerts", response_model=List[AlertSchema])
def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    alert_type: Optional[str] = None,
    mine_block: Optional[str] = None
):
    return alert_engine_service.get_all_alerts(
        status=status,
        severity=severity,
        alert_type=alert_type,
        mine_block=mine_block
    )

@router.get("/alerts/active", response_model=AlertSummaryResponse)
def get_active_alerts():
    return alert_engine_service.get_active_alerts()

@router.get("/alerts/history", response_model=List[AlertSchema])
def get_alert_history():
    return alert_engine_service.get_alert_history()

@router.get("/alerts/config", response_model=AlertThresholdsConfig)
def get_alert_config():
    return alert_engine_service.get_thresholds()

@router.post("/alerts/config", response_model=AlertThresholdsConfig)
def update_alert_config(config: Dict[str, Any]):
    return alert_engine_service.update_thresholds(config)

@router.get("/alerts/{alert_id}", response_model=AlertSchema)
def get_alert_by_id(alert_id: str):
    alert = alert_engine_service.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    return alert

@router.post("/alerts/{alert_id}/acknowledge", response_model=AlertSchema)
def acknowledge_alert(alert_id: str):
    try:
        return alert_engine_service.acknowledge_alert(alert_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

@router.post("/alerts/{alert_id}/resolve", response_model=AlertSchema)
def resolve_alert(alert_id: str):
    try:
        return alert_engine_service.resolve_alert(alert_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

