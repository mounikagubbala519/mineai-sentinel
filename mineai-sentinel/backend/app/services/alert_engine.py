"""
Alert & Early Warning Engine for MineAI Sentinel
Proactively detects operational risks from ML predictions, risk scores, equipment telemetry, weather, and reserve data.
Answers:
1. WHAT happened?
2. WHY is it happening?
3. HOW serious is it?
4. WHAT should the operator do?
"""
import os
import json
import datetime
from typing import List, Dict, Any, Optional
import threading

from app.core.config import settings
from app.core.data_provider import get_data_provider
from app.models.pydantic_schemas import (
    AlertSchema, AlertSeverity, AlertStatus, AlertType, AlertThresholdsConfig
)
from app.services.risk_engine import risk_engine_service
from app.services.recommendation_engine import recommendation_service

# Lazy predictor getter to avoid circular imports
_predictor = None
def get_predictor():
    global _predictor
    if _predictor is None:
        from ml.predictor import PredictorService
        _predictor = PredictorService()
    return _predictor

class AlertEngine:
    def __init__(self, storage_filepath: Optional[str] = None):
        self.lock = threading.Lock()
        self.thresholds = AlertThresholdsConfig()
        
        # Default storage path in data directory
        self.storage_filepath = storage_filepath or os.path.join(settings.BASE_DIR, "data", "alerts_state.json")
        
        # Internal state
        self.alerts_store: Dict[str, Dict[str, Any]] = {}
        
        # Load existing state if available
        self._load_from_storage()
        
    def _save_to_storage(self):
        try:
            os.makedirs(os.path.dirname(self.storage_filepath), exist_ok=True)
            with open(self.storage_filepath, "w") as f:
                json.dump(self.alerts_store, f, indent=2)
        except Exception as e:
            print(f"[AlertEngine] Warning: Could not save alert state to file: {e}")

    def _load_from_storage(self):
        try:
            if os.path.exists(self.storage_filepath):
                with open(self.storage_filepath, "r") as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        self.alerts_store = data
        except Exception as e:
            print(f"[AlertEngine] Warning: Could not load alert state from file: {e}")
            self.alerts_store = {}

    def get_thresholds(self) -> AlertThresholdsConfig:
        return self.thresholds

    def update_thresholds(self, new_config: Dict[str, Any]) -> AlertThresholdsConfig:
        with self.lock:
            for k, v in new_config.items():
                if hasattr(self.thresholds, k) and v is not None:
                    setattr(self.thresholds, k, float(v))
            self.evaluate_alerts()
            return self.thresholds

    def evaluate_alerts(self) -> List[Dict[str, Any]]:
        """
        Evaluates current operational data, ML predictions, equipment telemetry, weather, and reserves.
        Generates/updates deduplicated alerts in the alert store.
        """
        with self.lock:
            now_ts = datetime.datetime.now().timestamp()
            if hasattr(self, "_last_evaluated") and (now_ts - self._last_evaluated) < 5.0 and self.alerts_store:
                return list(self.alerts_store.values())
            self._last_evaluated = now_ts
            
            data_provider = get_data_provider()
            predictor = get_predictor()
            
            blocks_df = data_provider.get_block_data()
            prod_df = data_provider.get_production_data()
            eq_df = data_provider.get_equipment_data()
            env_df = data_provider.get_environmental_data()
            
            now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
            active_fingerprints = set()

            # Shared telemetry calculations
            avg_eq_avail = float(eq_df["availability_pct"].mean())
            total_downtime = float(eq_df["downtime_hours_month"].sum())
            high_risk_eq = eq_df[eq_df["downtime_risk"] == "HIGH"].to_dict(orient="records")
            
            recent_prod = prod_df.sort_values("date").tail(15)
            target_prod = float(recent_prod["target_production_tonnes"].mean())
            actual_prod = float(recent_prod["actual_production_tonnes"].mean())
            avg_blast_delay = float(recent_prod["blasting_delay_hours"].mean())
            avg_maint_delay = float(recent_prod["maintenance_delay_hours"].mean())
            avg_rain = float(recent_prod["rainfall_mm"].mean())
            active_machines = int(recent_prod["active_machines_count"].mean())
            operating_hrs = float(recent_prod["operating_hours"].mean())
            
            # Predict production forecast
            fc_res = predictor.predict_production(
                target_prod=target_prod,
                operating_hours=operating_hrs,
                active_machines=active_machines,
                blasting_delay=avg_blast_delay,
                maint_delay=avg_maint_delay,
                rainfall_mm=avg_rain
            )
            pred_next_day = fc_res["predicted_next_day_tonnes"]
            prod_gap = fc_res["production_gap_tonnes"]
            
            # Predict shortfall risk
            sf_res = predictor.predict_shortfall_risk(
                target_prod=target_prod,
                actual_expected=pred_next_day,
                maint_delay=avg_maint_delay,
                blasting_delay=avg_blast_delay,
                rainfall_mm=avg_rain,
                active_machines=active_machines,
                operating_hours=operating_hrs
            )
            shortfall_prob = sf_res["shortfall_probability_pct"]
            xai_factors = sf_res["contributing_factors"]
            
            # Risk Engine overall score
            risk_res = risk_engine_service.calculate_operational_risk(
                equipment_downtime_hrs=avg_maint_delay,
                rainfall_mm=avg_rain,
                blasting_delay_hrs=avg_blast_delay,
                equipment_availability_pct=avg_eq_avail
            )
            overall_risk = risk_res["overall_risk_score"]

            # AI Recommendations
            rec_res = recommendation_service.generate_recommendations(
                risk_data=risk_res,
                shortfall_prob_pct=shortfall_prob,
                equipment_downtime_hrs=avg_maint_delay,
                rainfall_mm=avg_rain,
                blasting_delay_hrs=avg_blast_delay
            )
            rec_actions = [r["suggested_action"] for r in rec_res["active_recommendations"]]

            # -------------------------------------------------------------
            # ALERT 1 — PRODUCTION SHORTFALL
            # -------------------------------------------------------------
            if prod_gap >= self.thresholds.production_gap_threshold or shortfall_prob >= self.thresholds.shortfall_prob_threshold:
                fp = "PRODUCTION_SHORTFALL:Balaghat Central Sector:gap"
                active_fingerprints.add(fp)
                
                if shortfall_prob >= 75.0 or prod_gap > 350.0:
                    sev = AlertSeverity.CRITICAL
                elif shortfall_prob >= 55.0 or prod_gap > 200.0:
                    sev = AlertSeverity.HIGH
                else:
                    sev = AlertSeverity.MEDIUM
                    
                self._upsert_alert(
                    fingerprint=fp,
                    alert_type=AlertType.PRODUCTION_SHORTFALL,
                    severity=sev,
                    title="Production Shortfall Predicted",
                    message=f"Expected daily ore production ({pred_next_day} TPD) is {prod_gap} TPD below target ({target_prod} TPD).",
                    mine_block="Balaghat Central Sector",
                    risk_score=overall_risk,
                    probability=shortfall_prob,
                    causes=[
                        {"factor": "Target vs Forecast Gap", "value": f"{prod_gap} Tonnes/day"},
                        {"factor": "Equipment Maintenance Delay", "value": f"{round(avg_maint_delay, 1)} hrs/shift"},
                        {"factor": "Blasting clearance delay", "value": f"{round(avg_blast_delay, 1)} hrs"}
                    ],
                    recommended_actions=rec_actions,
                    expected_impact={
                        "target_production_tpd": target_prod,
                        "predicted_production_tpd": pred_next_day,
                        "expected_shortfall_tpd": prod_gap,
                        "monthly_revenue_risk": f"₹{round(prod_gap * 30 * 8500 / 10000000, 2)} Cr"
                    },
                    xai_factors=xai_factors,
                    simulator_params={
                        "equipment_availability_pct": 88.0,
                        "downtime_hours": 1.5,
                        "rainfall_mm": avg_rain,
                        "blasting_delay_hours": 1.0,
                        "working_hours": 18.0,
                        "production_target_tonnes": target_prod,
                        "active_machines_count": 12
                    },
                    now_str=now_str
                )

            # -------------------------------------------------------------
            # ALERT 2 — EQUIPMENT RISK
            # -------------------------------------------------------------
            if avg_eq_avail < self.thresholds.fleet_availability_threshold or len(high_risk_eq) > 0:
                fp = "EQUIPMENT:Heavy Fleet:avail_critical"
                active_fingerprints.add(fp)
                
                if avg_eq_avail < 65.0:
                    sev = AlertSeverity.CRITICAL
                elif avg_eq_avail < 78.0:
                    sev = AlertSeverity.HIGH
                else:
                    sev = AlertSeverity.MEDIUM

                unavail_count = len(eq_df[eq_df["availability_pct"] < 75.0])
                top_affected = high_risk_eq[0]["equipment_id"] if high_risk_eq else "EQ-CAT-777D-01"
                
                self._upsert_alert(
                    fingerprint=fp,
                    alert_type=AlertType.EQUIPMENT,
                    severity=sev,
                    title="Fleet Availability Critical",
                    message=f"Heavy machinery availability dropped to {round(avg_eq_avail, 1)}%. {unavail_count} machines degraded.",
                    mine_block="Ukwa Pit & Haul Route",
                    risk_score=round(min(100.0, (100 - avg_eq_avail) * 1.8), 1),
                    probability=round(min(98.0, (100 - avg_eq_avail) * 1.5 + 20), 1),
                    causes=[
                        {"factor": "Fleet Availability Ratio", "value": f"{round(avg_eq_avail, 1)}%"},
                        {"factor": "Unavailable Asset Count", "value": f"{unavail_count} machines"},
                        {"factor": "Most Critical Breakdown Asset", "value": top_affected},
                        {"factor": "Total Fleet Monthly Downtime", "value": f"{round(total_downtime, 1)} hrs"}
                    ],
                    recommended_actions=[
                        f"Re-deploy standby CAT excavators to compensate for breakdown of {top_affected}.",
                        "Prioritize expedited hydraulic pump replacement during upcoming shift change.",
                        "Initiate emergency pit route maintenance."
                    ],
                    expected_impact={
                        "fleet_availability": f"{round(avg_eq_avail, 1)}%",
                        "unavailable_machines": unavail_count,
                        "most_affected_asset": top_affected,
                        "downtime_hours": f"{round(total_downtime, 1)} hrs"
                    },
                    xai_factors=[
                        {"factor": "Equipment Breakdown Frequency", "percentage": 42.5},
                        {"factor": "Monthly Maintenance Hours", "percentage": 31.0},
                        {"factor": "Engine Operating Hours Age", "percentage": 26.5}
                    ],
                    simulator_params={
                        "equipment_availability_pct": 90.0,
                        "downtime_hours": 1.0,
                        "rainfall_mm": avg_rain,
                        "blasting_delay_hours": avg_blast_delay,
                        "working_hours": operating_hrs,
                        "production_target_tonnes": target_prod,
                        "active_machines_count": active_machines + 2
                    },
                    now_str=now_str
                )

            # -------------------------------------------------------------
            # ALERT 3 — WEATHER / ENVIRONMENTAL RISK
            # -------------------------------------------------------------
            latest_env = env_df.sort_values("date").tail(1).to_dict(orient="records")[0]
            latest_rain = float(latest_env["rainfall_mm"])
            latest_soil = float(latest_env["soil_moisture_pct"])
            road_cond = latest_env.get("haul_road_condition", "MODERATE")
            
            if latest_rain >= self.thresholds.rainfall_threshold or latest_soil > 60.0 or road_cond in ["SLIPPERY", "HAZARDOUS"]:
                fp = f"WEATHER:{latest_env['block_id']}:rain_hazard"
                active_fingerprints.add(fp)
                
                if latest_rain > 50.0 or road_cond == "HAZARDOUS":
                    sev = AlertSeverity.CRITICAL
                elif latest_rain > 30.0 or road_cond == "SLIPPERY":
                    sev = AlertSeverity.HIGH
                else:
                    sev = AlertSeverity.MEDIUM
                    
                self._upsert_alert(
                    fingerprint=fp,
                    alert_type=AlertType.WEATHER,
                    severity=sev,
                    title="Heavy Rainfall Operational Risk",
                    message=f"Precipitation reached {latest_rain} mm with soil moisture at {latest_soil}%. Haul road condition: {road_cond}.",
                    mine_block=latest_env.get("block_id", "Ukwa West Slope"),
                    risk_score=float(latest_env.get("environmental_risk_score", 65.0)),
                    probability=round(min(95.0, latest_rain * 1.8 + 25.0), 1),
                    causes=[
                        {"factor": "Precipitation Depth", "value": f"{latest_rain} mm"},
                        {"factor": "Satellite Soil Moisture", "value": f"{latest_soil}%"},
                        {"factor": "Pit Haul Road Condition", "value": road_cond}
                    ],
                    recommended_actions=[
                        "Halt haulage on steep open-pit ramps and restrict haulers to gravel-stabilized upper benches.",
                        "Deploy drainage sump pumps on lower pit floor.",
                        "Enforce reduced pit speed limit (15 km/h) for heavy haulers."
                    ],
                    expected_impact={
                        "rainfall_depth": f"{latest_rain} mm",
                        "soil_moisture_pct": f"{latest_soil}%",
                        "road_condition": road_cond,
                        "haulage_throughput_reduction": "25-35%"
                    },
                    xai_factors=[
                        {"factor": "Rainfall Depth", "percentage": 55.0},
                        {"factor": "Soil Moisture Saturation", "percentage": 30.0},
                        {"factor": "Land Surface Temperature", "percentage": 15.0}
                    ],
                    simulator_params={
                        "equipment_availability_pct": avg_eq_avail,
                        "downtime_hours": avg_maint_delay,
                        "rainfall_mm": 5.0,
                        "blasting_delay_hours": avg_blast_delay,
                        "working_hours": operating_hrs,
                        "production_target_tonnes": target_prod,
                        "active_machines_count": active_machines
                    },
                    now_str=now_str
                )

            # -------------------------------------------------------------
            # ALERT 4 — BLASTING / OPERATIONAL DELAY
            # -------------------------------------------------------------
            if avg_blast_delay >= self.thresholds.blasting_delay_threshold:
                fp = "BLASTING_DELAY:Dongri Buzurg Section:clearance_delay"
                active_fingerprints.add(fp)
                
                sev = AlertSeverity.HIGH if avg_blast_delay > 3.5 else AlertSeverity.MEDIUM
                self._upsert_alert(
                    fingerprint=fp,
                    alert_type=AlertType.BLASTING_DELAY,
                    severity=sev,
                    title="Excessive Blasting Clearance Delay",
                    message=f"Blasting clearance delays averaged {round(avg_blast_delay, 1)} hours over recent shifts.",
                    mine_block="Dongri Buzurg Section",
                    risk_score=round(min(100.0, avg_blast_delay * 20.0), 1),
                    probability=round(min(90.0, avg_blast_delay * 18.0 + 15), 1),
                    causes=[
                        {"factor": "Blasting Delay Hours", "value": f"{round(avg_blast_delay, 1)} hrs"},
                        {"factor": "Baseline Clearance Standard", "value": "1.0 hr"},
                        {"factor": "Operational Mucking Loss", "value": f"~{round(avg_blast_delay * 90, 0)} tonnes"}
                    ],
                    recommended_actions=[
                        "Coordinate immediate safety clearance with site explosives supervisor prior to 14:00 shift change.",
                        "Align excavator mucking teams to begin loading as soon as bench clearance siren sounds."
                    ],
                    expected_impact={
                        "blasting_delay": f"{round(avg_blast_delay, 1)} hrs",
                        "mucking_tonnage_loss": f"{round(avg_blast_delay * 90, 0)} tonnes"
                    },
                    xai_factors=[
                        {"factor": "Explosive Clearance Protocol", "percentage": 60.0},
                        {"factor": "Safety Perimeter Clearance", "percentage": 40.0}
                    ],
                    simulator_params={
                        "equipment_availability_pct": avg_eq_avail,
                        "downtime_hours": avg_maint_delay,
                        "rainfall_mm": avg_rain,
                        "blasting_delay_hours": 0.5,
                        "working_hours": operating_hrs,
                        "production_target_tonnes": target_prod,
                        "active_machines_count": active_machines
                    },
                    now_str=now_str
                )

            # -------------------------------------------------------------
            # ALERT 5 — LOW ORE AVAILABILITY / GRADE DEFICIT
            # -------------------------------------------------------------
            low_grade_blocks = blocks_df[blocks_df["est_mn_grade_pct"] < 32.0].to_dict(orient="records")
            if len(low_grade_blocks) > 0:
                target_block = low_grade_blocks[0]
                b_id = target_block["block_id"]
                fp = f"LOW_ORE_AVAILABILITY:{b_id}:grade_deficit"
                active_fingerprints.add(fp)
                
                est_tonnage = float(target_block["est_tonnage_mt"])
                rec_tonnage = float(target_block["recoverable_tonnage_mt"])
                mn_grade = float(target_block["est_mn_grade_pct"])
                
                self._upsert_alert(
                    fingerprint=fp,
                    alert_type=AlertType.LOW_ORE_AVAILABILITY,
                    severity=AlertSeverity.MEDIUM,
                    title="Low Ore Grade & Recoverable Reserve Deficit",
                    message=f"Block {b_id} ({target_block['block_name']}) manganese grade dropped to {mn_grade}% Mn.",
                    mine_block=f"{b_id} ({target_block['block_name']})",
                    risk_score=round(max(35.0, (40.0 - mn_grade) * 3.5 + 20), 1),
                    probability=round(max(40.0, (40.0 - mn_grade) * 3.0 + 25), 1),
                    causes=[
                        {"factor": "Manganese Grade %", "value": f"{mn_grade}% Mn (Target: >38%)"},
                        {"factor": "Estimated Block Tonnage", "value": f"{est_tonnage} MT"},
                        {"factor": "Recoverable Ore Reserve", "value": f"{rec_tonnage} MT"}
                    ],
                    recommended_actions=[
                        f"Blend low-grade ore from {b_id} with high-grade stock (Mn > 44%) from Balaghat Central Vein.",
                        "Re-evaluate diamond core drilling density for deeper ore seams."
                    ],
                    expected_impact={
                        "estimated_tonnage": f"{est_tonnage} MT",
                        "recoverable_tonnage": f"{rec_tonnage} MT",
                        "mn_grade_pct": f"{mn_grade}% Mn"
                    },
                    xai_factors=[
                        {"factor": "Borehole Mn Grade Analysis", "percentage": 50.0},
                        {"factor": "Drill Depth Penalty", "percentage": 30.0},
                        {"factor": "Rock Density Specific Gravity", "percentage": 20.0}
                    ],
                    simulator_params={
                        "equipment_availability_pct": avg_eq_avail,
                        "downtime_hours": avg_maint_delay,
                        "rainfall_mm": avg_rain,
                        "blasting_delay_hours": avg_blast_delay,
                        "working_hours": operating_hrs,
                        "production_target_tonnes": target_prod,
                        "active_machines_count": active_machines
                    },
                    now_str=now_str
                )

            # -------------------------------------------------------------
            # ALERT 6 — OVERALL OPERATIONAL RISK
            # -------------------------------------------------------------
            if overall_risk >= self.thresholds.risk_score_high:
                fp = "OPERATIONAL_RISK:Balaghat Sector:composite_risk"
                active_fingerprints.add(fp)
                
                if overall_risk >= self.thresholds.risk_score_critical:
                    sev = AlertSeverity.CRITICAL
                else:
                    sev = AlertSeverity.HIGH
                    
                self._upsert_alert(
                    fingerprint=fp,
                    alert_type=AlertType.OPERATIONAL_RISK,
                    severity=sev,
                    title="High Operational Risk Level",
                    message=f"Composite Operational Risk Index reached {overall_risk}/100.",
                    mine_block="Balaghat & Ukwa Mine Network",
                    risk_score=overall_risk,
                    probability=round(min(98.0, overall_risk * 0.95), 1),
                    causes=[
                        {"factor": f["factor"], "value": f"+{f['contribution']} pts"}
                        for f in risk_res["factor_breakdown"][:3]
                    ],
                    recommended_actions=rec_actions,
                    expected_impact={
                        "overall_risk_score": f"{overall_risk}/100",
                        "risk_level": risk_res["risk_level"],
                        "top_risk_driver": risk_res["factor_breakdown"][0]["factor"]
                    },
                    xai_factors=[
                        {"factor": f["factor"], "percentage": round((f["contribution"] / max(1.0, overall_risk)) * 100, 1)}
                        for f in risk_res["factor_breakdown"][:4]
                    ],
                    simulator_params={
                        "equipment_availability_pct": 90.0,
                        "downtime_hours": 1.0,
                        "rainfall_mm": 5.0,
                        "blasting_delay_hours": 0.5,
                        "working_hours": 18.0,
                        "production_target_tonnes": target_prod,
                        "active_machines_count": 12
                    },
                    now_str=now_str
                )

            # Mark inactive alerts as RESOLVED
            for key, alert in list(self.alerts_store.items()):
                if alert["fingerprint"] not in active_fingerprints:
                    if alert["status"] in [AlertStatus.ACTIVE.value, AlertStatus.ACKNOWLEDGED.value]:
                        alert["status"] = AlertStatus.RESOLVED.value
                        alert["updated_at"] = now_str

            self._save_to_storage()
            return list(self.alerts_store.values())

    def _upsert_alert(self, fingerprint: str, alert_type: AlertType, severity: AlertSeverity,
                      title: str, message: str, mine_block: str, risk_score: float,
                      probability: float, causes: List[Dict[str, Any]],
                      recommended_actions: List[str], expected_impact: Dict[str, Any],
                      xai_factors: List[Dict[str, Any]], simulator_params: Dict[str, Any],
                      now_str: str):
        
        # Check if alert fingerprint already exists
        existing = None
        for key, item in self.alerts_store.items():
            if item.get("fingerprint") == fingerprint:
                existing = item
                break
                
        if existing:
            # Preserve ACKNOWLEDGED or ACTIVE status, update data
            existing["severity"] = severity.value
            existing["title"] = title
            existing["message"] = message
            existing["risk_score"] = risk_score
            existing["probability"] = probability
            existing["updated_at"] = now_str
            existing["causes"] = causes
            existing["recommended_actions"] = recommended_actions
            existing["expected_impact"] = expected_impact
            existing["xai_factors"] = xai_factors
            existing["simulator_params"] = simulator_params
            
            # If it was resolved, re-activate!
            if existing["status"] == AlertStatus.RESOLVED.value:
                existing["status"] = AlertStatus.ACTIVE.value
        else:
            # Create new alert
            new_id = f"ALT-{alert_type.value[:4]}-{len(self.alerts_store) + 1:03d}"
            alert_obj = {
                "id": new_id,
                "fingerprint": fingerprint,
                "alert_type": alert_type.value,
                "severity": severity.value,
                "title": title,
                "message": message,
                "mine_block": mine_block,
                "risk_score": risk_score,
                "probability": probability,
                "created_at": now_str,
                "updated_at": now_str,
                "status": AlertStatus.ACTIVE.value,
                "causes": causes,
                "recommended_actions": recommended_actions,
                "expected_impact": expected_impact,
                "xai_factors": xai_factors,
                "simulator_params": simulator_params
            }
            self.alerts_store[new_id] = alert_obj

    def get_all_alerts(self, status: Optional[str] = None, severity: Optional[str] = None,
                       alert_type: Optional[str] = None, mine_block: Optional[str] = None) -> List[Dict[str, Any]]:
        self.evaluate_alerts()
        res = list(self.alerts_store.values())
        
        if status:
            res = [a for a in res if a["status"] == status.upper()]
        if severity:
            res = [a for a in res if a["severity"] == severity.upper()]
        if alert_type:
            res = [a for a in res if a["alert_type"] == alert_type.upper()]
        if mine_block:
            res = [a for a in res if mine_block.lower() in a["mine_block"].lower()]
            
        # Sort by Severity priority then created_at
        sev_rank = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
        res = sorted(res, key=lambda x: (sev_rank.get(x["severity"], 0), x["created_at"]), reverse=True)
        return res

    def get_active_alerts(self) -> Dict[str, Any]:
        alerts = self.get_all_alerts()
        active = [a for a in alerts if a["status"] in [AlertStatus.ACTIVE.value, AlertStatus.ACKNOWLEDGED.value]]
        
        counts = {
            "total_active_count": len(active),
            "critical_count": len([a for a in active if a["severity"] == "CRITICAL"]),
            "high_count": len([a for a in active if a["severity"] == "HIGH"]),
            "medium_count": len([a for a in active if a["severity"] == "MEDIUM"]),
            "low_count": len([a for a in active if a["severity"] == "LOW"]),
            "alerts": active
        }
        return counts

    def get_alert_history(self) -> List[Dict[str, Any]]:
        alerts = self.get_all_alerts()
        history = [a for a in alerts if a["status"] == AlertStatus.RESOLVED.value]
        return history

    def get_alert_by_id(self, alert_id: str) -> Optional[Dict[str, Any]]:
        self.evaluate_alerts()
        return self.alerts_store.get(alert_id)

    def acknowledge_alert(self, alert_id: str) -> Dict[str, Any]:
        with self.lock:
            if alert_id in self.alerts_store:
                self.alerts_store[alert_id]["status"] = AlertStatus.ACKNOWLEDGED.value
                self.alerts_store[alert_id]["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                self._save_to_storage()
                return self.alerts_store[alert_id]
            raise KeyError(f"Alert ID {alert_id} not found.")

    def resolve_alert(self, alert_id: str) -> Dict[str, Any]:
        with self.lock:
            if alert_id in self.alerts_store:
                self.alerts_store[alert_id]["status"] = AlertStatus.RESOLVED.value
                self.alerts_store[alert_id]["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                self._save_to_storage()
                return self.alerts_store[alert_id]
            raise KeyError(f"Alert ID {alert_id} not found.")

alert_engine_service = AlertEngine()
