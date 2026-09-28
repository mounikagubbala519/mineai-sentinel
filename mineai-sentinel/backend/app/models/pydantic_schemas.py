"""
Pydantic Schemas for MineAI Sentinel API
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ReservePredictRequest(BaseModel):
    depth_m: float = Field(..., ge=10.0, le=500.0, description="Drillhole/deposit depth in meters")
    rock_density_gt_m3: float = Field(3.2, ge=2.0, le=5.0, description="Ore density in g/cm3")
    drill_hole_density: int = Field(8, ge=1, le=50, description="Exploration boreholes per hectare")
    elevation_m: float = Field(350.0, description="Elevation in meters")
    soil_moisture_pct: float = Field(35.0, description="Soil moisture ratio")
    ndvi_index: float = Field(0.45, description="Vegetation index")
    lst_temp_c: float = Field(30.0, description="Land surface temperature")
    annual_rainfall_mm: float = Field(1200.0, description="Annual rainfall mm")

class ReservePredictResponse(BaseModel):
    predicted_tonnage_mt: float
    predicted_mn_grade_pct: float
    predicted_recoverable_mt: float
    confidence_score_pct: float

class ForecastPredictRequest(BaseModel):
    target_production_tonnes: float = Field(1500.0, ge=100.0, le=5000.0)
    operating_hours: float = Field(18.0, ge=4.0, le=24.0)
    active_machines_count: int = Field(10, ge=1, le=25)
    blasting_delay_hours: float = Field(1.5, ge=0.0, le=12.0)
    maintenance_delay_hours: float = Field(2.0, ge=0.0, le=12.0)
    rainfall_mm: float = Field(15.0, ge=0.0, le=250.0)
    temperature_c: float = Field(32.0)
    avg_mn_grade_mined: float = Field(38.0)

class ForecastPredictResponse(BaseModel):
    predicted_next_day_tonnes: float
    predicted_7day_tonnes: float
    predicted_30day_tonnes: float
    target_production_tonnes: float
    production_gap_tonnes: float

class ShortfallPredictRequest(BaseModel):
    target_production_tonnes: float = Field(1800.0)
    actual_expected_tonnes: float = Field(1350.0)
    maintenance_delay_hours: float = Field(3.5)
    blasting_delay_hours: float = Field(2.0)
    rainfall_mm: float = Field(25.0)
    active_machines_count: int = Field(8)
    operating_hours: float = Field(16.0)

class ShortfallFactorContrib(BaseModel):
    factor: str
    percentage: float

class ShortfallPredictResponse(BaseModel):
    shortfall_probability_pct: float
    risk_category: str
    target_production_tonnes: float
    expected_production_tonnes: float
    expected_gap_tonnes: float
    contributing_factors: List[ShortfallFactorContrib]

class WhatIfRequest(BaseModel):
    equipment_availability_pct: float = Field(85.0, ge=30.0, le=100.0)
    downtime_hours: float = Field(2.0, ge=0.0, le=16.0)
    rainfall_mm: float = Field(10.0, ge=0.0, le=200.0)
    blasting_delay_hours: float = Field(1.0, ge=0.0, le=10.0)
    working_hours: float = Field(18.0, ge=6.0, le=24.0)
    production_target_tonnes: float = Field(1800.0, ge=500.0, le=4000.0)
    active_machines_count: int = Field(10, ge=2, le=20)

from enum import Enum

class AlertSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AlertStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"

class AlertType(str, Enum):
    PRODUCTION_SHORTFALL = "PRODUCTION_SHORTFALL"
    EQUIPMENT = "EQUIPMENT"
    WEATHER = "WEATHER"
    BLASTING_DELAY = "BLASTING_DELAY"
    LOW_ORE_AVAILABILITY = "LOW_ORE_AVAILABILITY"
    OPERATIONAL_RISK = "OPERATIONAL_RISK"

class WhatIfResponse(BaseModel):
    before: Dict[str, Any]
    after: Dict[str, Any]
    delta: Dict[str, Any]

class RiskFactorBreakdown(BaseModel):
    factor: str
    contribution: float
    status: str

class OperationalRiskResponse(BaseModel):
    overall_risk_score: float
    risk_level: str
    factor_breakdown: List[RiskFactorBreakdown]

class RecommendationItem(BaseModel):
    id: str
    title: str
    priority: str
    affected_factor: str
    suggested_action: str
    expected_objective: str
    risk_category: str

class RecommendationResponse(BaseModel):
    disclaimer: str
    active_recommendations: List[RecommendationItem]

class AlertSchema(BaseModel):
    id: str
    fingerprint: str
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    mine_block: Optional[str] = "Balaghat Sector"
    risk_score: float = 0.0
    probability: float = 0.0
    created_at: str
    updated_at: str
    status: AlertStatus = AlertStatus.ACTIVE
    causes: List[Dict[str, Any]] = []
    recommended_actions: List[str] = []
    expected_impact: Dict[str, Any] = {}
    xai_factors: List[Dict[str, Any]] = []
    simulator_params: Optional[Dict[str, Any]] = None

class AlertSummaryResponse(BaseModel):
    total_active_count: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    alerts: List[AlertSchema]

class AlertThresholdsConfig(BaseModel):
    fleet_availability_threshold: float = Field(75.0, description="Minimum acceptable fleet availability %")
    production_gap_threshold: float = Field(150.0, description="Shortfall gap threshold in tonnes/day")
    rainfall_threshold: float = Field(20.0, description="Precipitation threshold in mm")
    risk_score_high: float = Field(60.0, description="High risk score threshold (0-100)")
    risk_score_critical: float = Field(80.0, description="Critical risk score threshold (0-100)")
    ore_availability_threshold: float = Field(30.0, description="Ore grade/availability deficit threshold")
    blasting_delay_threshold: float = Field(2.0, description="Blasting clearance delay threshold in hours")
    downtime_hours_threshold: float = Field(4.0, description="Monthly equipment breakdown downtime threshold in hours")
    shortfall_prob_threshold: float = Field(50.0, description="Shortfall probability threshold %")

