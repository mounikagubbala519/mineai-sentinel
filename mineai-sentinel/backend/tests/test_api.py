"""
Unit tests for MineAI Sentinel Backend & ML API
"""
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["demo_mode"] is True

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_estimated_reserves_mt" in data
    assert "shortfall_probability_pct" in data
    assert "demo_badge" in data

def test_reserves_map():
    response = client.get("/api/reserves/map")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0

def test_reserve_prediction():
    payload = {
        "depth_m": 120.0,
        "rock_density_gt_m3": 3.4,
        "drill_hole_density": 10,
        "elevation_m": 340.0,
        "soil_moisture_pct": 30.0,
        "ndvi_index": 0.45,
        "lst_temp_c": 28.0,
        "annual_rainfall_mm": 1200.0
    }
    response = client.post("/api/reserves/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_tonnage_mt" in data
    assert "predicted_mn_grade_pct" in data

def test_what_if_simulation():
    payload = {
        "equipment_availability_pct": 90.0,
        "downtime_hours": 1.0,
        "rainfall_mm": 5.0,
        "blasting_delay_hours": 0.5,
        "working_hours": 20.0,
        "production_target_tonnes": 2000.0,
        "active_machines_count": 12
    }
    response = client.post("/api/what-if", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "before" in data
    assert "after" in data
    assert "delta" in data

def test_model_metrics():
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "reserve_model" in data["metrics"]
    assert "production_model" in data["metrics"]
    assert "shortfall_model" in data["metrics"]

def test_alerts_system():
    # Test GET /api/alerts
    res = client.get("/api/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert isinstance(alerts, list)
    assert len(alerts) > 0

    # Test GET /api/alerts/active
    active_res = client.get("/api/alerts/active")
    assert active_res.status_code == 200
    summary = active_res.json()
    assert "total_active_count" in summary
    assert "alerts" in summary
    assert len(summary["alerts"]) > 0

    # Test GET /api/alerts/{alert_id}
    target_id = summary["alerts"][0]["id"]
    detail_res = client.get(f"/api/alerts/{target_id}")
    assert detail_res.status_code == 200
    alert_detail = detail_res.json()
    assert alert_detail["id"] == target_id
    assert "causes" in alert_detail
    assert "recommended_actions" in alert_detail
    assert "xai_factors" in alert_detail

    # Test POST /api/alerts/{alert_id}/acknowledge
    ack_res = client.post(f"/api/alerts/{target_id}/acknowledge")
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "ACKNOWLEDGED"

    # Test POST /api/alerts/{alert_id}/resolve
    res_res = client.post(f"/api/alerts/{target_id}/resolve")
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "RESOLVED"

    # Test GET /api/alerts/history
    hist_res = client.get("/api/alerts/history")
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) > 0

    # Test GET /api/alerts/config and POST /api/alerts/config
    cfg_res = client.get("/api/alerts/config")
    assert cfg_res.status_code == 200
    assert "fleet_availability_threshold" in cfg_res.json()

    update_res = client.post("/api/alerts/config", json={"fleet_availability_threshold": 80.0})
    assert update_res.status_code == 200
    assert update_res.json()["fleet_availability_threshold"] == 80.0

