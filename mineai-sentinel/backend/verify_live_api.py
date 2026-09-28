"""
Live REST API verification script for MineAI Sentinel Backend
Queries all active endpoints from the running Uvicorn server at http://127.0.0.1:8000
"""
import urllib.request
import json
import os

BASE_URL = "http://127.0.0.1:8000"

def get(endpoint):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, headers={"User-Agent": "VerificationScript/1.0"})
    with urllib.request.urlopen(req, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))

def post(endpoint, payload):
    url = f"{BASE_URL}{endpoint}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))

def verify_all():
    print("Checking Live Server Endpoints...", flush=True)
    report = {}

    print("1. /api/health", flush=True)
    report["health"] = get("/api/health")

    print("2. /api/dashboard/summary", flush=True)
    report["dashboard_summary"] = get("/api/dashboard/summary")

    print("3. /api/reserves", flush=True)
    report["reserves"] = get("/api/reserves")

    print("4. /api/reserves/map", flush=True)
    report["reserves_map"] = get("/api/reserves/map")

    print("5. /api/reserves/predict", flush=True)
    report["reserve_predict"] = post("/api/reserves/predict", {
        "depth_m": 150.0,
        "rock_density_gt_m3": 2.85,
        "drill_hole_density": 18.0,
        "elevation_m": 340.0,
        "soil_moisture_pct": 32.0,
        "ndvi_index": 0.42,
        "lst_temp_c": 28.5,
        "annual_rainfall_mm": 1150.0
    })

    print("6. /api/production/history", flush=True)
    report["production_history"] = get("/api/production/history")

    print("7. /api/production/forecast", flush=True)
    report["production_forecast"] = get("/api/production/forecast")

    print("8. /api/shortfall/predict", flush=True)
    report["shortfall_predict"] = post("/api/shortfall/predict", {
        "target_production_tonnes": 1800.0,
        "actual_expected_tonnes": 1350.0,
        "maintenance_delay_hours": 3.5,
        "blasting_delay_hours": 2.0,
        "rainfall_mm": 25.0,
        "active_machines_count": 8,
        "operating_hours": 16.0
    })

    print("9. /api/equipment", flush=True)
    report["equipment"] = get("/api/equipment")

    print("10. /api/equipment/risks", flush=True)
    report["equipment_risks"] = get("/api/equipment/risks")

    print("11. /api/environment", flush=True)
    report["environment"] = get("/api/environment")

    print("12. /api/risks", flush=True)
    report["operational_risks"] = get("/api/risks")

    print("13. /api/recommendations", flush=True)
    report["recommendations"] = get("/api/recommendations")

    print("14. /api/what-if", flush=True)
    report["what_if"] = post("/api/what-if", {
        "equipment_availability_pct": 92.0,
        "downtime_hours": 1.0,
        "rainfall_mm": 5.0,
        "blasting_delay_hours": 0.5,
        "working_hours": 20.0,
        "production_target_tonnes": 1800.0,
        "active_machines_count": 12
    })

    print("15. /api/model/metrics", flush=True)
    report["model_metrics"] = get("/api/model/metrics")

    print("16. /api/alerts/active", flush=True)
    report["active_alerts"] = get("/api/alerts/active")

    out_file = os.path.join(os.path.dirname(__file__), "live_verification_report.json")
    with open(out_file, "w") as f:
        json.dump(report, f, indent=2)

    print("\n================ LIVE VERIFICATION ALL PASSED ================\n", flush=True)
    print(f"Report saved to {out_file}", flush=True)

if __name__ == "__main__":
    verify_all()
