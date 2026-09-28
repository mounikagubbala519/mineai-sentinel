"""
Operational Risk Engine for MineAI Sentinel
Calculates dynamic composite 0-100 risk score and factor breakdowns.
"""
from typing import Dict, Any, List

class RiskEngine:
    def __init__(self, low_threshold=30.0, medium_threshold=60.0):
        self.low_threshold = low_threshold
        self.medium_threshold = medium_threshold

    def calculate_operational_risk(self, equipment_downtime_hrs: float = 3.5,
                                  rainfall_mm: float = 25.0,
                                  soil_moisture_pct: float = 55.0,
                                  blasting_delay_hrs: float = 2.0,
                                  reserve_availability_pct: float = 72.0,
                                  ore_grade_pct: float = 36.0,
                                  target_pressure_ratio: float = 1.1,
                                  equipment_availability_pct: float = 78.0,
                                  maint_backlog_hrs: float = 40.0) -> Dict[str, Any]:
        """
        Calculates composite 0-100 operational risk score based on multi-factor telemetry.
        """
        factors = []
        
        # 1. Equipment Downtime Contribution (0 - 25 pts)
        dt_score = min(25.0, equipment_downtime_hrs * 4.5)
        factors.append({
            "factor": "Equipment Downtime",
            "contribution": round(dt_score, 1),
            "status": "CRITICAL" if dt_score > 15.0 else ("WARNING" if dt_score > 8.0 else "NORMAL")
        })
        
        # 2. Heavy Rainfall & Soil Moisture (0 - 22 pts)
        rain_score = min(15.0, rainfall_mm * 0.35) + min(7.0, (soil_moisture_pct - 30.0) * 0.15 if soil_moisture_pct > 30 else 0)
        factors.append({
            "factor": "Heavy Rainfall & Soil Moisture",
            "contribution": round(rain_score, 1),
            "status": "CRITICAL" if rain_score > 14.0 else ("WARNING" if rain_score > 7.0 else "NORMAL")
        })
        
        # 3. Blasting Delay (0 - 18 pts)
        blast_score = min(18.0, blasting_delay_hrs * 5.0)
        factors.append({
            "factor": "Blasting Clearance Delay",
            "contribution": round(blast_score, 1),
            "status": "CRITICAL" if blast_score > 12.0 else ("WARNING" if blast_score > 6.0 else "NORMAL")
        })
        
        # 4. Equipment Availability (0 - 15 pts)
        avail_deficit = max(0.0, 95.0 - equipment_availability_pct)
        avail_score = min(15.0, avail_deficit * 0.45)
        factors.append({
            "factor": "Low Equipment Availability",
            "contribution": round(avail_score, 1),
            "status": "CRITICAL" if avail_score > 10.0 else ("WARNING" if avail_score > 5.0 else "NORMAL")
        })
        
        # 5. Reserve Availability & Ore Grade (0 - 12 pts)
        reserve_deficit = max(0.0, 80.0 - reserve_availability_pct)
        grade_deficit = max(0.0, 42.0 - ore_grade_pct)
        res_score = min(8.0, reserve_deficit * 0.25) + min(4.0, grade_deficit * 0.3)
        factors.append({
            "factor": "Reserve & Ore Grade Deficit",
            "contribution": round(res_score, 1),
            "status": "WARNING" if res_score > 6.0 else "NORMAL"
        })
        
        # 6. Target Pressure Ratio (0 - 8 pts)
        press_score = min(8.0, max(0.0, (target_pressure_ratio - 1.0) * 20.0))
        factors.append({
            "factor": "Production Target Pressure",
            "contribution": round(press_score, 1),
            "status": "WARNING" if press_score > 5.0 else "NORMAL"
        })
        
        total_score = round(min(100.0, sum(f["contribution"] for f in factors)), 1)
        
        if total_score > self.medium_threshold:
            risk_level = "HIGH"
        elif total_score > self.low_threshold:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        # Sort factors by highest risk contribution first
        factors = sorted(factors, key=lambda x: x["contribution"], reverse=True)
        
        return {
            "overall_risk_score": total_score,
            "risk_level": risk_level,
            "factor_breakdown": factors
        }

risk_engine_service = RiskEngine()
