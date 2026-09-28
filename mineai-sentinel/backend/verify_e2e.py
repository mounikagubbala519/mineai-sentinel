"""
End-to-End Verification Script for MineAI Sentinel Backend & Alert Engine
"""
import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def run_verification():
    report = {}
    with TestClient(app) as client:
        # 1. Health Endpoint
        res = client.get("/api/health")
        report["health"] = {"status_code": res.status_code, "data": res.json()}
        
        # 2. Executive Dashboard Summary
        res = client.get("/api/dashboard/summary")
        report["dashboard_summary"] = {"status_code": res.status_code, "data": res.json()}
        
        # 3. Active Alerts
        res = client.get("/api/alerts/active")
        report["active_alerts"] = {"status_code": res.status_code, "data": res.json()}

        # 4. All Alerts (filtered)
        res = client.get("/api/alerts")
        alerts_list = res.json()
        report["all_alerts"] = {"status_code": res.status_code, "count": len(alerts_list), "sample": alerts_list[0] if alerts_list else None}

        # 5. Alert Details (Inspect first alert)
        if alerts_list:
            target_id = alerts_list[0]["id"]
            res = client.get(f"/api/alerts/{target_id}")
            report["alert_detail"] = {"status_code": res.status_code, "data": res.json()}
            
            # Test Acknowledge
            res_ack = client.post(f"/api/alerts/{target_id}/acknowledge")
            report["alert_acknowledge"] = {"status_code": res_ack.status_code, "status": res_ack.json().get("status")}

        # 6. Operational Risk Engine
        res = client.get("/api/risks")
        report["operational_risk"] = {"status_code": res.status_code, "data": res.json()}

        # 7. AI Recommendation Engine
        res = client.get("/api/recommendations")
        report["recommendations"] = {"status_code": res.status_code, "data": res.json()}

        # 8. Production Forecast
        res = client.get("/api/production/forecast")
        report["production_forecast"] = {"status_code": res.status_code, "data": res.json()}

        # 9. Shortfall Risk Prediction
        sf_payload = {
            "target_production_tonnes": 1800.0,
            "actual_expected_tonnes": 1350.0,
            "maintenance_delay_hours": 3.5,
            "blasting_delay_hours": 2.0,
            "rainfall_mm": 25.0,
            "active_machines_count": 8,
            "operating_hours": 16.0
        }
        res = client.post("/api/shortfall/predict", json=sf_payload)
        report["shortfall_prediction"] = {"status_code": res.status_code, "data": res.json()}

        # 10. What-If Scenario Simulator
        wi_payload = {
            "equipment_availability_pct": 92.0,
            "downtime_hours": 1.0,
            "rainfall_mm": 5.0,
            "blasting_delay_hours": 0.5,
            "working_hours": 20.0,
            "production_target_tonnes": 1800.0,
            "active_machines_count": 12
        }
        res = client.post("/api/what-if", json=wi_payload)
        report["what_if_simulation"] = {"status_code": res.status_code, "data": res.json()}

        # 11. Alert Threshold Configuration
        res = client.get("/api/alerts/config")
        report["alert_config"] = {"status_code": res.status_code, "data": res.json()}

    # Print Report Output
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    run_verification()
