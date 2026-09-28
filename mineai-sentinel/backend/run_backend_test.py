"""
Direct verification script for MineAI Sentinel backend endpoints
Writes output directly to verification_output.json
"""
import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.api import endpoints
from app.models.pydantic_schemas import ShortfallPredictRequest, WhatIfRequest

def test_all():
    results = {}
    print("Testing Health Endpoint...", flush=True)
    results["health"] = endpoints.health_check()
    
    print("Testing Dashboard Summary...", flush=True)
    results["dashboard_summary"] = endpoints.get_dashboard_summary()
    
    print("Testing Active Alerts...", flush=True)
    results["active_alerts"] = endpoints.get_active_alerts()
    
    print("Testing Operational Risk Engine...", flush=True)
    results["operational_risk"] = endpoints.get_risks()
    
    print("Testing AI Recommendation Engine...", flush=True)
    results["recommendations"] = endpoints.get_recommendations()
    
    print("Testing Production Forecast...", flush=True)
    results["production_forecast"] = endpoints.get_production_forecast()
    
    print("Testing Shortfall Prediction...", flush=True)
    sf_req = ShortfallPredictRequest(
        target_production_tonnes=1800.0,
        actual_expected_tonnes=1350.0,
        maintenance_delay_hours=3.5,
        blasting_delay_hours=2.0,
        rainfall_mm=25.0,
        active_machines_count=8,
        operating_hours=16.0
    )
    results["shortfall_predict"] = endpoints.predict_shortfall(sf_req)
    
    print("Testing What-If Simulator...", flush=True)
    wi_req = WhatIfRequest(
        equipment_availability_pct=92.0,
        downtime_hours=1.0,
        rainfall_mm=5.0,
        blasting_delay_hours=0.5,
        working_hours=20.0,
        production_target_tonnes=1800.0,
        active_machines_count=12
    )
    results["what_if"] = endpoints.simulate_what_if(wi_req)

    print("Testing Model Performance Metrics...", flush=True)
    results["model_metrics"] = endpoints.get_model_metrics()

    out_path = os.path.join(os.path.dirname(__file__), "verification_output.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2, default=str)

    print("\n================ VERIFICATION SUCCESS ================\n", flush=True)
    print(f"Results written to {out_path}", flush=True)

if __name__ == "__main__":
    test_all()
