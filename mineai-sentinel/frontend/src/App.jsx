import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// View Modules
import ExecutiveDashboard from './components/ExecutiveDashboard';
import MineMap from './components/MineMap';
import ReserveIntelligence from './components/ReserveIntelligence';
import ProductionForecast from './components/ProductionForecast';
import ShortfallRisk from './components/ShortfallRisk';
import EquipmentHealth from './components/EquipmentHealth';
import SatelliteEnvironment from './components/SatelliteEnvironment';
import WhatIfSimulator from './components/WhatIfSimulator';
import AiRecommendations from './components/AiRecommendations';
import ModelPerformance from './components/ModelPerformance';
import AlertCenter from './components/AlertCenter';
import AlertHistory from './components/AlertHistory';

import { api } from './api';
import { alarmSystem } from './utils/audioAlarm';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data states
  const [summaryData, setSummaryData] = useState(null);
  const [reserveData, setReserveData] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [equipmentData, setEquipmentData] = useState(null);
  const [envData, setEnvData] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState(null);

  const [simulatorParams, setSimulatorParams] = useState(null);
  const [isHighRisk, setIsHighRisk] = useState(false);

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const [sum, res, map, hist, fc, eq, env, rec] = await Promise.allSettled([
        api.getDashboardSummary(),
        api.getReserves(),
        api.getReservesMap(),
        api.getProductionHistory(),
        api.getProductionForecast(),
        api.getEquipment(),
        api.getEnvironment(),
        api.getRecommendations()
      ]);

      if (sum.status === 'fulfilled' && sum.value) {
        const data = sum.value;
        setSummaryData(data);
        const hasRisk = data.shortfall_probability_pct > 60 || data.overall_risk_level === 'HIGH';
        setIsHighRisk(hasRisk);
        if (hasRisk) {
          alarmSystem.playAlarmSound();
        }
      } else {
        // Fallback default demo summary data if API call is unfulfilled
        setSummaryData({
          total_estimated_reserves_mt: 45200000,
          recoverable_reserves_mt: 38400000,
          current_daily_production_tonnes: 3450,
          target_daily_production_tonnes: 4000,
          production_gap_tonnes: 550,
          shortfall_probability_pct: 74.5,
          overall_risk_level: 'HIGH',
          overall_risk_score: 78,
          equipment_availability_pct: 68.5,
          environmental_risk_score: 62.0,
          active_alerts: [
            { id: 'ALT-101', title: 'Haul Truck Downtime Spike', message: 'Fleet B-03 breakdown frequency +35%', severity: 'HIGH' },
            { id: 'ALT-102', title: 'Heavy Rainfall Advisory', message: 'Pit 2 haul road instability risk elevated', severity: 'MEDIUM' }
          ]
        });
      }

      if (res.status === 'fulfilled') setReserveData(res.value);
      if (map.status === 'fulfilled') setMapData(map.value);
      if (hist.status === 'fulfilled') setHistoryData(hist.value);
      if (fc.status === 'fulfilled') setForecastData(fc.value);
      if (eq.status === 'fulfilled') setEquipmentData(eq.value);
      if (env.status === 'fulfilled') setEnvData(env.value);
      if (rec.status === 'fulfilled') setRecommendationsData(rec.value);

    } catch (err) {
      console.error('[MineAI Sentinel] Data loading error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleTestAlarm = () => {
    alarmSystem.playAlarmSound();
    setTimeout(() => {
      alarmSystem.stopAlarmSound();
    }, 2500);
  };

  const handleNavigateToSimulator = (params) => {
    if (params) {
      setSimulatorParams(params);
    }
    setActiveTab('simulator');
  };

  const activeAlertCount = summaryData?.active_alerts ? summaryData.active_alerts.length : 0;

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ExecutiveDashboard summaryData={summaryData} historyData={historyData} onNavigate={setActiveTab} />;
      case 'alerts':
        return <AlertCenter onNavigateToSimulator={handleNavigateToSimulator} />;
      case 'map':
        return <MineMap mapData={mapData} />;
      case 'reserves':
        return <ReserveIntelligence reserveData={reserveData} />;
      case 'forecast':
        return <ProductionForecast historyData={historyData} forecastData={forecastData} />;
      case 'shortfall':
        return <ShortfallRisk summaryData={summaryData} onRiskEvaluated={(riskState) => setIsHighRisk(riskState)} />;
      case 'equipment':
        return <EquipmentHealth equipmentData={equipmentData} />;
      case 'environment':
        return <SatelliteEnvironment envData={envData} />;
      case 'simulator':
        return <WhatIfSimulator initialParams={simulatorParams} />;
      case 'recommendations':
        return <AiRecommendations recommendationsData={recommendationsData} />;
      case 'history':
        return <AlertHistory />;
      case 'performance':
        return <ModelPerformance />;
      default:
        return <ExecutiveDashboard summaryData={summaryData} historyData={historyData} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        onRefresh={loadAllData}
        isRefreshing={isRefreshing}
        isHighRisk={isHighRisk}
        onTriggerTestAlarm={handleTestAlarm}
        activeAlertCount={activeAlertCount}
        onOpenAlerts={() => setActiveTab('alerts')}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
}
