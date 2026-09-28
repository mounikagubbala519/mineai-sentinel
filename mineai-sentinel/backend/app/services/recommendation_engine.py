"""
AI Recommendation Engine for MineAI Sentinel
Generates dynamic actionable recommendations from risk engine & model prediction outputs.
"""
from typing import List, Dict, Any

DISCLAIMER_TEXT = (
    "Prototype decision-support recommendations. Final operational decisions "
    "must be made by qualified mining engineering and safety professionals."
)

class RecommendationEngine:
    def generate_recommendations(self, risk_data: Dict[str, Any],
                                 shortfall_prob_pct: float = 45.0,
                                 equipment_downtime_hrs: float = 3.5,
                                 rainfall_mm: float = 25.0,
                                 blasting_delay_hrs: float = 2.0,
                                 low_reserve_block: str = "BLK-B04") -> Dict[str, Any]:
        
        recommendations = []
        rec_counter = 1
        
        # Rule 1: High Equipment Downtime
        if equipment_downtime_hrs >= 2.5:
            recommendations.append({
                "id": f"REC-00{rec_counter}",
                "title": "Equipment Fleet Re-allocation",
                "priority": "HIGH" if equipment_downtime_hrs > 4.5 else "MEDIUM",
                "affected_factor": "Equipment Downtime",
                "suggested_action": f"Re-deploy 2 available CAT haulers from low-priority reserve block ({low_reserve_block}) to high-yield Balaghat Central vein to compensate for {equipment_downtime_hrs}h breakdown loss.",
                "expected_objective": "+180 Tonnes/day production recovery",
                "risk_category": "EQUIPMENT"
            })
            rec_counter += 1
            
        # Rule 2: Heavy Rainfall & Weather
        if rainfall_mm >= 15.0:
            recommendations.append({
                "id": f"REC-00{rec_counter}",
                "title": "Pit Operations & Haul-Road Weather Protocol",
                "priority": "HIGH" if rainfall_mm > 40.0 else "MEDIUM",
                "affected_factor": "Weather / Rainfall",
                "suggested_action": f"Heavy rainfall ({rainfall_mm}mm) detected. Temporarily halt deep-pit haulage on slippery incline roads; divert heavy excavators to upper well-drained benches.",
                "expected_objective": "Prevent pit haulage accidents & maintain 75% baseline throughput",
                "risk_category": "WEATHER"
            })
            rec_counter += 1

        # Rule 3: High Blasting Delays
        if blasting_delay_hrs >= 1.5:
            recommendations.append({
                "id": f"REC-00{rec_counter}",
                "title": "Blasting Clearance & Window Optimization",
                "priority": "HIGH" if blasting_delay_hrs > 3.0 else "MEDIUM",
                "affected_factor": "Blasting Clearance",
                "suggested_action": f"Blasting delay is currently {blasting_delay_hrs}h above baseline. Coordinate immediate explosive clearance with safety officers for the upcoming 14:00 shift window.",
                "expected_objective": "Eliminate 90 minutes of downstream mucking delays",
                "risk_category": "BLASTING"
            })
            rec_counter += 1
            
        # Rule 4: Production Shortfall Risk
        if shortfall_prob_pct >= 50.0:
            recommendations.append({
                "id": f"REC-00{rec_counter}",
                "title": "High-Grade Block Prioritization",
                "priority": "HIGH",
                "affected_factor": "Production Shortfall",
                "suggested_action": f"Shortfall risk probability reached {shortfall_prob_pct}%. Prioritize extraction from high-grade accessible blocks (Mn > 40%) to satisfy monthly delivery contracts.",
                "expected_objective": "Close production gap by 240 Tonnes/day",
                "risk_category": "PRODUCTION"
            })
            rec_counter += 1
            
        # Default Baseline Optimization Recommendation if risk is low
        if not recommendations:
            recommendations.append({
                "id": f"REC-00{rec_counter}",
                "title": "Preventive Maintenance Scheduling",
                "priority": "LOW",
                "affected_factor": "Fleet Availability",
                "suggested_action": "Operations are stable within normal safety parameters. Proceed with scheduled preventive maintenance for hydraulic excavators.",
                "expected_objective": "Maintain >90% fleet availability threshold",
                "risk_category": "MAINTENANCE"
            })
            
        return {
            "disclaimer": DISCLAIMER_TEXT,
            "active_recommendations": recommendations
        }

recommendation_service = RecommendationEngine()
