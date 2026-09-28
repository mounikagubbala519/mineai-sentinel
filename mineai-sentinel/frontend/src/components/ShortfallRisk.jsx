import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Cpu, BarChart2, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import { api } from '../api';
import { alarmSystem } from '../utils/audioAlarm';

export default function ShortfallRisk({ summaryData, onRiskEvaluated }) {
  const [formState, setFormState] = useState({
    target_production_tonnes: 1800.0,
    actual_expected_tonnes: 1350.0,
    maintenance_delay_hours: 3.5,
    blasting_delay_hours: 2.0,
    rainfall_mm: 25.0,
    active_machines_count: 8,
    operating_hours: 16.0,
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(alarmSystem.isMuted);

  const handleInputChange = (e) => {
    setFormState({ ...formState, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const checkAndPlayAlarm = (prob, category) => {
    const highRisk = prob > 60 || category === 'HIGH';
    if (onRiskEvaluated) onRiskEvaluated(highRisk);
    if (highRisk) {
      alarmSystem.playAlarmSound();
    } else {
      alarmSystem.stopAlarmSound();
    }
  };

  const handlePredictShortfall = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await api.predictShortfall(formState);
      setPrediction(res);
      checkAndPlayAlarm(res.shortfall_probability_pct, res.risk_category);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handlePredictShortfall();
  }, []);

  const displayData = prediction || {
    shortfall_probability_pct: summaryData ? summaryData.shortfall_probability_pct : 68.4,
    risk_category: summaryData ? (summaryData.shortfall_probability_pct > 60 ? 'HIGH' : 'MEDIUM') : 'HIGH',
    target_production_tonnes: summaryData ? summaryData.target_daily_production_tonnes : 1800.0,
    expected_production_tonnes: summaryData ? summaryData.forecasted_daily_production_tonnes : 1350.0,
    expected_gap_tonnes: summaryData ? summaryData.production_gap_tonnes : 450.0,
    contributing_factors: [
      { factor: 'Equipment Breakdown Downtime', percentage: 38.5 },
      { factor: 'Heavy Rainfall & Mud Siltation', percentage: 26.2 },
      { factor: 'Blasting Clearance Delay', percentage: 18.3 },
      { factor: 'Active Machinery Ratio', percentage: 17.0 }
    ]
  };

  const isHighRisk = displayData.shortfall_probability_pct > 60 || displayData.risk_category === 'HIGH';

  const toggleAlarmMute = () => {
    const muted = alarmSystem.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="space-y-6">
      {/* Risk Alert Sound Banner */}
      {isHighRisk && (
        <div className="bg-rose-950/80 border-2 border-rose-500 rounded-2xl p-4 flex items-center justify-between shadow-2xl animate-pulse">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="h-7 w-7 text-rose-400 animate-bounce" />
            <div>
              <h3 className="text-sm font-bold text-rose-200 uppercase tracking-wider flex items-center gap-2">
                🚨 EMERGENCY RISK ALARM SOUNDING
              </h3>
              <p className="text-xs text-rose-300 mt-0.5">
                Production Shortfall Probability exceeds safety threshold ({displayData.shortfall_probability_pct}% Risk). Audible siren alert is active!
              </p>
            </div>
          </div>
          <button
            onClick={toggleAlarmMute}
            className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-lg flex items-center space-x-1.5"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 animate-pulse" />}
            <span>{isMuted ? 'UNMUTE ALARM' : 'MUTE ALARM SOUND'}</span>
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-white flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
          <span>Production Shortfall Risk & Root-Cause Classifier</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Scikit-Learn Classifier predicting production shortfall probability, triggering automated audio sirens upon risk detection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Probability Gauge Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider flex items-center justify-between">
              <span>Shortfall Probability</span>
              {isHighRisk && (
                <span className="text-[10px] text-rose-400 font-bold animate-pulse flex items-center gap-1">
                  <Volume2 className="h-3 w-3" /> AUDIO SIREN ACTIVE
                </span>
              )}
            </div>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className={`text-5xl font-black font-mono tracking-tight ${
                displayData.shortfall_probability_pct > 60 ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {displayData.shortfall_probability_pct}%
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                displayData.risk_category === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {displayData.risk_category} RISK
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400">Target Tonnage:</span>
                <div className="font-bold text-white font-mono mt-0.5">{displayData.target_production_tonnes} tpd</div>
              </div>
              <div>
                <span className="text-slate-400">Expected Output:</span>
                <div className="font-bold text-cyan-400 font-mono mt-0.5">{displayData.expected_production_tonnes} tpd</div>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-800">
                <span className="text-slate-400">Forecasted Production Gap:</span>
                <div className="font-bold text-rose-400 font-mono text-sm mt-0.5">-{displayData.expected_gap_tonnes} Tonnes</div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center text-[11px] text-slate-500">
            <span>Model: HistGradientBoostingClassifier</span>
            <button
              onClick={() => {
                alarmSystem.playAlarmSound();
                setTimeout(() => alarmSystem.stopAlarmSound(), 2000);
              }}
              className="text-cyan-400 underline font-semibold hover:text-cyan-300"
            >
              Test Siren Sound
            </button>
          </div>
        </div>

        {/* Explainability Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>Explainable AI Risk Factors</span>
            </h3>
            <span className="text-[10px] text-slate-400">Feature Importance %</span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            "Why is the system predicting high shortfall risk and sounding alarm?"
          </p>

          <div className="space-y-3.5">
            {displayData.contributing_factors.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-200 font-medium">{item.factor}</span>
                  <span className="font-mono text-cyan-400 font-bold">{item.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shortfall Risk Predictor Query Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Shortfall Classifier Query</h3>
          
          <form onSubmit={handlePredictShortfall} className="space-y-2.5 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Target Production (tpd)</label>
              <input
                type="number"
                name="target_production_tonnes"
                value={formState.target_production_tonnes}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Maintenance Loss (hrs)</label>
              <input
                type="number"
                step="0.5"
                name="maintenance_delay_hours"
                value={formState.maintenance_delay_hours}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Blasting Delay (hrs)</label>
              <input
                type="number"
                step="0.5"
                name="blasting_delay_hours"
                value={formState.blasting_delay_hours}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Rainfall (mm)</label>
              <input
                type="number"
                name="rainfall_mm"
                value={formState.rainfall_mm}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold py-2.5 rounded-xl shadow-md transition hover:brightness-110"
            >
              {loading ? 'Evaluating Risk & Audio Alert...' : 'Run Risk Classifier & Alarm Check'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
