# Data Dictionary — MineAI Sentinel Prototype

This data dictionary documents all fields across the 5 synthetic datasets used in the **MineAI Sentinel** platform. These datasets model manganese mining operations across the Madhya Pradesh / Maharashtra manganese ore belt (Balaghat, Ukwa, Dongri Buzurg, Tirodi, Bharweli).

---

## 1. Block & Geological Data (`block_data.csv` / `geological_data.csv`)

| Field Name | Data Type | Range / Units | Description |
| :--- | :--- | :--- | :--- |
| `block_id` | String | `BLK-B01` to `BLK-B15` | Unique identifier for the mine block / deposit area. |
| `block_name` | String | Text | Geographic / geological name of the deposit section (e.g., Balaghat Central Vein). |
| `latitude` | Float | 21.65° to 22.00° N | Geographic latitude (Demo/Synthetic coordinates). |
| `longitude` | Float | 80.00° to 80.35° E | Geographic longitude (Demo/Synthetic coordinates). |
| `elevation_m` | Float | 280.0 – 420.0 m | Surface elevation above mean sea level. |
| `depth_m` | Float | 45.0 – 320.0 m | Average drilling depth / ore body depth. |
| `rock_density_gt_m3` | Float | 2.85 – 4.15 g/cm³ | Bulk rock/ore specific gravity / density. |
| `drill_hole_density` | Integer | 4 – 18 holes/ha | Number of core drilling boreholes per hectare. |
| `est_mn_grade_pct` | Float | 28.5% – 46.5% Mn | Estimated manganese content percentage. |
| `soil_moisture_pct` | Float | 15.0% – 75.0% | Satellite soil moisture content ratio. |
| `ndvi_index` | Float | 0.18 – 0.68 | Normalized Difference Vegetation Index. |
| `lst_temp_c` | Float | 22.0°C – 41.5°C | Land Surface Temperature from satellite thermal telemetry. |
| `annual_rainfall_mm` | Float | 950.0 – 2100.0 mm | Mean annual rainfall depth. |
| `est_tonnage_mt` | Float | Thousand Metric Tonnes | Model-predicted total estimated ore reserve tonnage. |
| `recoverable_tonnage_mt` | Float | Thousand Metric Tonnes | Estimated recoverable ore tonnage after mining loss factors. |

---

## 2. Production Time Series Data (`production_data.csv`)

| Field Name | Data Type | Range / Units | Description |
| :--- | :--- | :--- | :--- |
| `date` | Date | `YYYY-MM-DD` | Daily observation timestamp over 180 days. |
| `block_id` | String | `BLK-B01` to `BLK-B15` | Associated mine block identifier. |
| `target_production_tonnes` | Float | 1200.0 – 2200.0 t/day | Planned daily production target tonnage. |
| `actual_production_tonnes` | Float | 200.0 – 2800.0 t/day | Actual ore excavated and processed per day. |
| `operating_hours` | Float | 8.0 – 24.0 hours | Active operating shift hours per day. |
| `active_machines_count` | Integer | 5 – 14 machines | Number of heavy machines deployed on pit. |
| `blasting_delay_hours` | Float | 0.0 – 6.0 hours | Operational delays caused by blasting clearance/weather. |
| `maintenance_delay_hours` | Float | 0.0 – 8.0 hours | Equipment breakdown and downtime loss hours. |
| `rainfall_mm` | Float | 0.0 – 120.0 mm | Daily site rainfall gauge reading. |
| `temperature_c` | Float | 18.0°C – 44.0°C | Ambient site temperature. |
| `avg_mn_grade_mined` | Float | 26.0% – 48.0% Mn | Average grade of mined ore batches. |

---

## 3. Equipment Fleet Data (`equipment_data.csv`)

| Field Name | Data Type | Range / Units | Description |
| :--- | :--- | :--- | :--- |
| `equipment_id` | String | Code | Unique machinery serial ID (e.g. `EQ-CAT-777D-01`). |
| `equipment_type` | String | Categorical | Machine type: Haul Truck, Excavator, Drill, Loader. |
| `block_id` | String | Code | Assigned mine block location. |
| `operating_hours_total` | Float | 1500.0 – 18500.0 hrs | Cumulative engine operating hours. |
| `maintenance_hours_month` | Float | 8.0 – 95.0 hrs | Monthly maintenance duration. |
| `downtime_hours_month` | Float | 5.0 – 180.0 hrs | Total breakdown downtime in the last 30 days. |
| `breakdown_frequency` | Integer | 0 – 8 incidents | Breakdown count in the last 30 days. |
| `fuel_efficiency_lph` | Float | 20.0 – 85.0 L/h | Fuel consumption rate in Liters per Hour. |
| `availability_pct` | Float | 45.0% – 99.0% | Asset availability percentage. |
| `downtime_risk` | String | `LOW`, `MEDIUM`, `HIGH` | Equipment breakdown risk rating. |
| `production_contribution_tpd` | Float | Tonnes/day | Daily tonnage output contributed by equipment asset. |

---

## 4. Satellite & Environmental Data (`environmental_data.csv`)

| Field Name | Data Type | Range / Units | Description |
| :--- | :--- | :--- | :--- |
| `date` | Date | `YYYY-MM-DD` | Daily observation timestamp. |
| `block_id` | String | Code | Mine block location. |
| `rainfall_mm` | Float | 0.0 – 120.0 mm | Daily surface rainfall depth. |
| `soil_moisture_pct` | Float | 10.0% – 90.0% | Satellite-derived soil moisture ratio. |
| `ndvi` | Float | 0.10 – 0.85 | Vegetation cover index surrounding mine pit edges. |
| `land_surface_temp_c` | Float | 15.0°C – 45.0°C | Land Surface Thermal satellite reading. |
| `haul_road_condition` | String | Categorical | `EXCELLENT`, `MODERATE`, `SLIPPERY`, `HAZARDOUS`. |
| `environmental_risk_score` | Float | 0.0 – 100.0 | Calculated composite environmental hazard score. |

---

## Data Provider Interface Architecture

Future real operational datasets from MOIL Limited can replace synthetic datasets by implementing the `DataProvider` abstract interface:

```python
class DataProvider(ABC):
    @abstractmethod
    def get_block_data(self) -> pd.DataFrame: pass
    
    @abstractmethod
    def get_production_data(self) -> pd.DataFrame: pass
    
    @abstractmethod
    def get_equipment_data(self) -> pd.DataFrame: pass
    
    @abstractmethod
    def get_environmental_data(self) -> pd.DataFrame: pass
```

`SyntheticDataProvider` implements this interface using local synthetic CSVs, while `RealDataProvider` can connect directly to PostgreSQL/PostGIS or MOIL ERP APIs.
