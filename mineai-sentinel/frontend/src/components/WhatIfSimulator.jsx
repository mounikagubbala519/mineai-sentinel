import React, { useState } from 'react';
import { Sliders, ArrowRight, TrendingUp, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function WhatIfSimulator({ initialParams }) {
  const [params, setParams] = useState({
    equipment_availability_pct: initialParams?.equipment_availability_pct ?? 85.0,
    downtime_hours: initialParams?.downtime_hours ?? 2.0,
    rainfall_mm: initialParams?.rainfall_mm ?? 10.0,
    blasting_delay_hours: initialParams?.blasting_delay_hours ?? 1.0,
    working_hours: initialParams?.working_hours ?? 18.0,
    production_target_tonnes: initialParams?.production_target_tonnes ?? 1800.0,
    active_machines_count: initialParams?.active_machines_count ?? 10,
  });

  React.useEffect(() => {
    if (initialParams) {
      setParams(prev => ({
        ...prev,
        ...initialParams
      }));
    }
  }, [initialParams]);

  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSliderChange = (name, val) => {
    setParams(prev => ({ ...prev, [name]: parseFloat(val) }));
  };

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.simulateWhatIf(params);
      setSimulation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    handleRunSimulation();
  }, [params]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-white flex items-center space-x-2">
          <Sliders className="h-5 w-5 text-cyan-400" />
          <span>What-If Operational Scenario Simulator</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Simulate operational decisions by adjusting equipment fleet availability, weather delays, and shift hours to observe real-time impact on production forecast and risk level.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Parameter Sliders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-slate-800 pb-2">
            Operational Parameter Controls
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Fleet Availability</span>
                <span className="font-mono text-cyan-400 font-bold">{Number(params.equipment_availability_pct).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                step="1"
                value={params.equipment_availability_pct}
                onChange={(e) => handleSliderChange('equipment_availability_pct', e.target.value)}
                className="w-full accent-cyan-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Breakdown Downtime</span>
                <span className="font-mono text-rose-400 font-bold">{Number(params.downtime_hours).toFixed(1)} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={params.downtime_hours}
                onChange={(e) => handleSliderChange('downtime_hours', e.target.value)}
                className="w-full accent-rose-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Precipitation / Rainfall</span>
                <span className="font-mono text-indigo-400 font-bold">{Number(params.rainfall_mm).toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={params.rainfall_mm}
                onChange={(e) => handleSliderChange('rainfall_mm', e.target.value)}
                className="w-full accent-indigo-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Blasting Clearance Delay</span>
                <span className="font-mono text-amber-400 font-bold">{Number(params.blasting_delay_hours).toFixed(1)} hrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={params.blasting_delay_hours}
                onChange={(e) => handleSliderChange('blasting_delay_hours', e.target.value)}
                className="w-full accent-amber-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Active Shift Hours</span>
                <span className="font-mono text-emerald-400 font-bold">{Number(params.working_hours).toFixed(1)} hrs</span>
              </div>
              <input
                type="range"
                min="8"
                max="24"
                step="1"
                value={params.working_hours}
                onChange={(e) => handleSliderChange('working_hours', e.target.value)}
                className="w-full accent-emerald-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Active Machines Deployed</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(params.active_machines_count)}</span>
              </div>
              <input
                type="range"
                min="3"
                max="18"
                step="1"
                value={params.active_machines_count}
                onChange={(e) => handleSliderChange('active_machines_count', e.target.value)}
                className="w-full accent-cyan-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs py-3 rounded-xl transition duration-150 shadow-md shadow-cyan-500/20"
          >
            {loading ? 'Recalculating Scenario...' : 'Execute What-If Simulation'}
          </button>
        </div>

        {/* Side-by-Side Comparison (BEFORE vs AFTER) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-white">Before vs After Simulation Comparison</h3>
              {simulation && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  simulation.delta.status === 'IMPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  Status: {simulation.delta.status}
                </span>
              )}
            </div>

            {simulation ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BEFORE CARD */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Before Adjustment (Baseline)</div>
                  
                  <div>
                    <span className="text-xs text-slate-400 block">Expected Production:</span>
                    <span className="text-xl font-bold text-white font-mono">{simulation.before.expected_production_tonnes} tpd</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block">Shortfall Probability:</span>
                    <span className="text-lg font-bold text-rose-400 font-mono">{simulation.before.shortfall_probability_pct}%</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="font-bold text-amber-400 font-mono">{simulation.before.risk_score}/100 ({simulation.before.risk_category})</span>
                  </div>
                </div>

                {/* AFTER CARD */}
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3">
                  <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">After Scenario Adjustment</div>
                  
                  <div>
                    <span className="text-xs text-slate-400 block">Expected Production:</span>
                    <span className="text-xl font-bold text-cyan-400 font-mono">{simulation.after.expected_production_tonnes} tpd</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block">Shortfall Probability:</span>
                    <span className={`text-lg font-bold font-mono ${simulation.after.shortfall_probability_pct < 40 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {simulation.after.shortfall_probability_pct}%
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className="font-bold text-cyan-300 font-mono">{simulation.after.risk_score}/100 ({simulation.after.risk_category})</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl text-xs">
                Adjust parameter sliders on the left and click "Execute What-If Simulation" to calculate live production changes.
              </div>
            )}
          </div>

          {simulation && (
            <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between text-slate-300 font-mono">
              <span>Production Delta: <b className="text-emerald-400">+{simulation.delta.production_change_tonnes} tpd</b></span>
              <span>Risk Score Change: <b className="text-cyan-400">{simulation.delta.risk_score_change} pts</b></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
