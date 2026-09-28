"""
Synthetic Data Generator for MineAI Sentinel
Generates realistic, physically-correlated synthetic datasets for Manganese ore mining operations.
"""
import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_all_datasets(output_dir="data/raw", seed=42):
    np.random.seed(seed)
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Block & Geological Data (15 Mine Blocks)
    blocks_data = []
    block_names = [
        "Balaghat Central Vein", "Balaghat North Extension", "Ukwa East Deposit", 
        "Ukwa West Slope", "Bharweli Deep Pit", "Bharweli Ridge", 
        "Dongri Buzurg South", "Dongri Buzurg Main", "Chikitmara Hill", 
        "Tirodi North Ore Body", "Tirodi South Vein", "Sitapatore Block A", 
        "Sitapatore Block B", "Kandri East Pit", "Mansar Ore Horizon"
    ]
    
    # Coordinates centered around Madhya Pradesh / Maharashtra Manganese Belt (Balaghat area ~21.8°N, 80.18°E)
    base_lat = 21.8150
    base_lon = 80.1850
    
    for i in range(15):
        block_id = f"BLK-B{i+1:02d}"
        block_name = block_names[i]
        lat = base_lat + np.random.uniform(-0.15, 0.15)
        lon = base_lon + np.random.uniform(-0.15, 0.15)
        elevation_m = round(float(np.random.uniform(280.0, 420.0)), 2)
        depth_m = round(float(np.random.uniform(45.0, 320.0)), 2)
        rock_density = round(float(np.random.uniform(2.85, 4.15)), 2)
        drill_density = int(np.random.randint(4, 18))
        est_mn_grade = round(float(np.random.uniform(28.5, 46.5)), 2)
        
        soil_moisture = round(float(np.random.uniform(15.0, 75.0)), 2)
        ndvi = round(float(np.random.uniform(0.18, 0.68)), 3)
        lst_temp = round(float(np.random.uniform(22.0, 41.5)), 1)
        annual_rainfall = round(float(np.random.uniform(950.0, 2100.0)), 1)
        
        # Physical model for tonnage estimation with noise
        # Tonnage depends on rock density, depth, drill density, and Mn grade
        base_volume_k_m3 = (depth_m * 12.5) + (drill_density * 45.0)
        raw_tonnage = (base_volume_k_m3 * rock_density * (est_mn_grade / 100.0))
        noise = np.random.normal(1.0, 0.08) # 8% realistic noise
        est_tonnage = round(float(raw_tonnage * noise), 2)
        
        recovery_factor = min(0.92, max(0.68, 0.85 - (depth_m / 1000.0) + (est_mn_grade / 200.0)))
        recoverable_tonnage = round(float(est_tonnage * recovery_factor), 2)
        
        blocks_data.append({
            "block_id": block_id,
            "block_name": block_name,
            "latitude": round(lat, 5),
            "longitude": round(lon, 5),
            "elevation_m": elevation_m,
            "depth_m": depth_m,
            "rock_density_gt_m3": rock_density,
            "drill_hole_density": drill_density,
            "est_mn_grade_pct": est_mn_grade,
            "soil_moisture_pct": soil_moisture,
            "ndvi_index": ndvi,
            "lst_temp_c": lst_temp,
            "annual_rainfall_mm": annual_rainfall,
            "est_tonnage_mt": est_tonnage,
            "recoverable_tonnage_mt": recoverable_tonnage
        })
        
    df_blocks = pd.DataFrame(blocks_data)
    df_blocks.to_csv(os.path.join(output_dir, "block_data.csv"), index=False)
    df_blocks.to_csv(os.path.join(output_dir, "geological_data.csv"), index=False)
    
    # 2. Production Time Series Data (180 Days across 15 blocks = 2700 records)
    start_date = datetime(2025, 9, 1)
    prod_records = []
    
    for day in range(180):
        current_date = (start_date + timedelta(days=day)).strftime("%Y-%m-%d")
        
        # Seasonal weather variation (monsoon simulation around day 0-30)
        seasonal_rain_prob = 0.6 if day < 30 else 0.2
        
        for idx, block in df_blocks.iterrows():
            block_id = block["block_id"]
            
            # Weather factors
            if np.random.rand() < seasonal_rain_prob:
                rainfall_mm = round(float(np.random.gamma(shape=2.5, scale=12.0)), 1)
            else:
                rainfall_mm = round(float(np.random.exponential(scale=3.0)), 1) if np.random.rand() < 0.3 else 0.0
                
            temp_c = round(float(25.0 + 10.0 * np.sin(day / 30.0) + np.random.normal(0, 2.5)), 1)
            
            # Operational parameters
            target_prod = float(np.random.choice([1200, 1500, 1800, 2000, 2200]))
            active_machines = int(np.random.randint(5, 14))
            operating_hours = round(float(min(24.0, max(8.0, 18.0 + np.random.normal(0, 2.5)))), 1)
            
            # Delays
            # Heavy rain causes blasting delays and maintenance delays
            blasting_delay = round(float(max(0.0, np.random.exponential(scale=0.5) + (rainfall_mm / 25.0))), 2)
            maint_delay = round(float(max(0.0, np.random.exponential(scale=1.0) + (14 - active_machines) * 0.4)), 2)
            
            # Actual production generation with realistic bottlenecks
            capacity = (active_machines * 135.0) * (operating_hours / 20.0)
            delay_loss = (blasting_delay * 85.0) + (maint_delay * 110.0) + (rainfall_mm * 6.5)
            mn_factor = (block["est_mn_grade_pct"] / 38.0)
            
            raw_actual = (capacity - delay_loss) * mn_factor * np.random.normal(0.95, 0.06)
            actual_prod = round(float(max(200.0, min(target_prod * 1.3, raw_actual))), 1)
            
            avg_mn_mined = round(float(block["est_mn_grade_pct"] + np.random.normal(0, 1.2)), 2)
            
            prod_records.append({
                "date": current_date,
                "block_id": block_id,
                "target_production_tonnes": target_prod,
                "actual_production_tonnes": actual_prod,
                "operating_hours": operating_hours,
                "active_machines_count": active_machines,
                "blasting_delay_hours": blasting_delay,
                "maintenance_delay_hours": maint_delay,
                "rainfall_mm": rainfall_mm,
                "temperature_c": temp_c,
                "avg_mn_grade_mined": avg_mn_mined
            })
            
    df_prod = pd.DataFrame(prod_records)
    df_prod.to_csv(os.path.join(output_dir, "production_data.csv"), index=False)
    
    # 3. Equipment Fleet Data (25 Heavy Equipment Fleet Assets)
    eq_types = ["Haul Truck", "Hydraulic Excavator", "Blast Hole Drill", "Wheel Loader"]
    eq_models = {
        "Haul Truck": ["EQ-CAT-777D", "EQ-KOM-HD785", "EQ-BEL-BH60H"],
        "Hydraulic Excavator": ["EQ-KOM-PC1250", "EQ-CAT-6015B", "EQ-HIT-EX1200"],
        "Blast Hole Drill": ["EQ-SAN-DP1500", "EQ-EPI-D65", "EQ-ATL-ROC"],
        "Wheel Loader": ["EQ-CAT-988K", "EQ-KOM-WA600", "EQ-VOL-L350H"]
    }
    
    equipment_list = []
    for idx in range(25):
        eq_type = np.random.choice(eq_types)
        model_prefix = np.random.choice(eq_models[eq_type])
        eq_id = f"{model_prefix}-{idx+1:02d}"
        block_id = f"BLK-B{(idx % 15) + 1:02d}"
        
        op_hours_total = round(float(np.random.uniform(1500, 18500)), 1)
        maint_hours_month = round(float(np.random.uniform(8.0, 95.0)), 1)
        downtime_hours = round(float(maint_hours_month * np.random.uniform(1.1, 1.8)), 1)
        breakdowns = int(np.random.poisson(lam=max(0.5, downtime_hours / 25.0)))
        
        fuel_eff = round(float(np.random.uniform(30.0, 85.0)), 1) if eq_type == "Haul Truck" else round(float(np.random.uniform(20.0, 60.0)), 1)
        
        total_month_hours = 720.0
        avail_pct = round(float(max(45.0, min(99.0, ((total_month_hours - downtime_hours) / total_month_hours) * 100.0))), 1)
        
        if avail_pct < 75.0 or breakdowns >= 5:
            dt_risk = "HIGH"
        elif avail_pct < 88.0 or breakdowns >= 3:
            dt_risk = "MEDIUM"
        else:
            dt_risk = "LOW"
            
        prod_contrib = round(float(avail_pct * np.random.uniform(4.5, 8.5)), 1)
        
        equipment_list.append({
            "equipment_id": eq_id,
            "equipment_type": eq_type,
            "block_id": block_id,
            "operating_hours_total": op_hours_total,
            "maintenance_hours_month": maint_hours_month,
            "downtime_hours_month": downtime_hours,
            "breakdown_frequency": breakdowns,
            "fuel_efficiency_lph": fuel_eff,
            "availability_pct": avail_pct,
            "downtime_risk": dt_risk,
            "production_contribution_tpd": prod_contrib
        })
        
    df_eq = pd.DataFrame(equipment_list)
    df_eq.to_csv(os.path.join(output_dir, "equipment_data.csv"), index=False)
    
    # 4. Satellite & Environmental Data (180 Days x 15 Blocks)
    env_records = []
    for day in range(180):
        current_date = (start_date + timedelta(days=day)).strftime("%Y-%m-%d")
        for idx, block in df_blocks.iterrows():
            block_id = block["block_id"]
            
            # Find matching rainfall from production or generate correlated satellite rainfall
            rain = df_prod[(df_prod["date"] == current_date) & (df_prod["block_id"] == block_id)]["rainfall_mm"].values[0]
            
            soil_moist = round(float(min(90.0, max(10.0, 20.0 + (rain * 0.75) + np.random.normal(0, 3.0)))), 1)
            ndvi_val = round(float(min(0.85, max(0.10, block["ndvi_index"] + (soil_moist / 300.0) + np.random.normal(0, 0.02)))), 3)
            lst_temp = round(float(max(15.0, block["lst_temp_c"] - (rain * 0.12) + np.random.normal(0, 1.5))), 1)
            
            if rain > 40.0 or soil_moist > 70.0:
                road_cond = "HAZARDOUS"
                env_score = round(float(min(100.0, 65.0 + (rain * 0.5) + (soil_moist * 0.2))), 1)
            elif rain > 15.0 or soil_moist > 50.0:
                road_cond = "SLIPPERY"
                env_score = round(float(35.0 + (rain * 0.8)), 1)
            elif rain > 5.0:
                road_cond = "MODERATE"
                env_score = round(float(20.0 + rain), 1)
            else:
                road_cond = "EXCELLENT"
                env_score = round(float(max(5.0, np.random.normal(12.0, 4.0))), 1)
                
            env_records.append({
                "date": current_date,
                "block_id": block_id,
                "rainfall_mm": rain,
                "soil_moisture_pct": soil_moist,
                "ndvi": ndvi_val,
                "land_surface_temp_c": lst_temp,
                "haul_road_condition": road_cond,
                "environmental_risk_score": env_score
            })
            
    df_env = pd.DataFrame(env_records)
    df_env.to_csv(os.path.join(output_dir, "environmental_data.csv"), index=False)
    
    print(f"[MineAI Sentinel] Generated synthetic datasets in '{output_dir}':")
    print(f"  - block_data.csv ({len(df_blocks)} rows)")
    print(f"  - geological_data.csv ({len(df_blocks)} rows)")
    print(f"  - production_data.csv ({len(df_prod)} rows)")
    print(f"  - equipment_data.csv ({len(df_eq)} rows)")
    print(f"  - environmental_data.csv ({len(df_env)} rows)")

if __name__ == "__main__":
    generate_all_datasets()
