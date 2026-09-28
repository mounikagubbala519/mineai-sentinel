"""
What-If Scenario Simulator Engine for MineAI Sentinel
Simulates operational parameter adjustments and recalculates expected production, shortfall risk, and recommendations.
"""
from typing import Dict, Any
from app.services.risk_engine import risk_engine_service
from ml.predictor import PredictorService

class SimulatorService:
    def __init__(self):
        self.predictor = None

    def _get_predictor(self):
        if self.predictor is None:
            self.predictor = PredictorService()
        return self.predictor

    def simulate_scenario(self, equipment_avail: float = 85.0,
                          downtime_hrs: float = 2.0,
                          rainfall_mm: float = 10.0,
                          blasting_delay: float = 1.0,
                          working_hrs: float = 18.0,
                          target_prod: float = 1800.0,
                          active_machines: int = 10) -> Dict[str, Any]:
        
        predictor = self._get_predictor()
        
        # 1. BASELINE (BEFORE SCENARIO)
        base_target = 1800.0
        base_avail = 70.0
        base_downtime = 4.5
        base_rain = 35.0
        base_blast = 3.0
        base_work_hrs = 14.0
        base_machines = 7
        
        base_forecast = predictor.predict_production(
            target_prod=base_target,
            operating_hours=base_work_hrs,
            active_machines=base_machines,
            blasting_delay=base_blast,
            maint_delay=base_downtime,
            rainfall_mm=base_rain
        )
        
        base_shortfall = predictor.predict_shortfall_risk(
            target_prod=base_target,
            actual_expected=base_forecast["predicted_next_day_tonnes"],
            maint_delay=base_downtime,
            blasting_delay=base_blast,
            rainfall_mm=base_rain,
            active_machines=base_machines,
            operating_hours=base_work_hrs
        )
        
        base_risk = risk_engine_service.calculate_operational_risk(
            equipment_downtime_hrs=base_downtime,
            rainfall_mm=base_rain,
            blasting_delay_hrs=base_blast,
            equipment_availability_pct=base_avail
        )
        
        before_state = {
            "expected_production_tonnes": base_forecast["predicted_next_day_tonnes"],
            "production_target_tonnes": base_target,
            "production_gap_tonnes": base_forecast["production_gap_tonnes"],
            "shortfall_probability_pct": base_shortfall["shortfall_probability_pct"],
            "risk_score": base_risk["overall_risk_score"],
            "risk_category": base_risk["risk_level"]
        }
        
        # 2. SIMULATED AFTER SCENARIO
        sim_forecast = predictor.predict_production(
            target_prod=target_prod,
            operating_hours=working_hrs,
            active_machines=active_machines,
            blasting_delay=blasting_delay,
            maint_delay=downtime_hrs,
            rainfall_mm=rainfall_mm
        )
        
        sim_shortfall = predictor.predict_shortfall_risk(
            target_prod=target_prod,
            actual_expected=sim_forecast["predicted_next_day_tonnes"],
            maint_delay=downtime_hrs,
            blasting_delay=blasting_delay,
            rainfall_mm=rainfall_mm,
            active_machines=active_machines,
            operating_hours=working_hrs
        )
        
        sim_risk = risk_engine_service.calculate_operational_risk(
            equipment_downtime_hrs=downtime_hrs,
            rainfall_mm=rainfall_mm,
            blasting_delay_hrs=blasting_delay,
            equipment_availability_pct=equipment_avail
        )
        
        after_state = {
            "expected_production_tonnes": sim_forecast["predicted_next_day_tonnes"],
            "production_target_tonnes": target_prod,
            "production_gap_tonnes": sim_forecast["production_gap_tonnes"],
            "shortfall_probability_pct": sim_shortfall["shortfall_probability_pct"],
            "risk_score": sim_risk["overall_risk_score"],
            "risk_category": sim_risk["risk_level"]
        }
        
        # 3. CALCULATE DELTA
        delta = {
            "production_change_tonnes": round(after_state["expected_production_tonnes"] - before_state["expected_production_tonnes"], 1),
            "production_gap_change": round(after_state["production_gap_tonnes"] - before_state["production_gap_tonnes"], 1),
            "shortfall_prob_change_pct": round(after_state["shortfall_probability_pct"] - before_state["shortfall_probability_pct"], 1),
            "risk_score_change": round(after_state["risk_score"] - before_state["risk_score"], 1),
            "status": "IMPROVED" if after_state["risk_score"] < before_state["risk_score"] else "DEGRADED"
        }
        
        return {
            "before": before_state,
            "after": after_state,
            "delta": delta
        }

simulator_service = SimulatorService()
