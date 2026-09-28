import React, { useState } from 'react';
import { TrendingUp, Calendar, AlertCircle, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { api } from '../api';

export default function ProductionForecast({ historyData, forecastData }) {
  const [customForecast, setCustomForecast] = useState(forecastData);
  const [formState, setFormState] = useState({
    target_production_tonnes: 1800.0,
    operating_hours: 18.0,
    active_machines_count: 10,
    blasting_delay_hours: 1.5,
    maintenance_delay_hours: 2.0,
    rainfall_mm: 15.0,
    temperature_c: 32.0,
    avg_mn_grade_mined: 38.0,
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormState({ ...formState, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const handleRunForecast = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.predictForecast(formState);
      setCustomForecast(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayData = customForecast || forecastData || {
    predicted_next_day_tonnes: 1650.0,
    predicted_7day_tonnes: 11400.0,
    predicted_30day_tonnes: 48500.0,
    target_production_tonnes: 1800.0,
    production_gap_tonnes: 150.0,
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-white flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
          <span>Production Forecasting Engine</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Time-series forecasting model with 1-day, 7-day, and 30-day horizon predictions utilizing operational lag features and bottleneck telemetry.
        </p>
      </div>

      {/* Forecast Horizon Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-cyan-500">
          <div className="text-xs text-slate-400">Next-Day Forecast</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {displayData.predicted_next_day_tonnes} <span className="text-sm font-normal text-slate-400">tonnes</span>
          </div>
          <div className="text-xs text-cyan-400 mt-1">Target: {displayData.target_production_tonnes} tpd</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-indigo-500">
          <div className="text-xs text-slate-400">7-Day Cumulative Forecast</div>
          <div className="text-2xl font-bold text-indigo-400 font-mono mt-1">
            {displayData.predicted_7day_tonnes} <span className="text-sm font-normal text-slate-400">tonnes</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">7-day expected output</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 border-l-4 border-l-emerald-500">
          <div className="text-xs text-slate-400">30-Day Monthly Forecast</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            {displayData.predicted_30day_tonnes} <span className="text-sm font-normal text-slate-400">tonnes</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Expected monthly tonnage</div>
        </div>
      </div>

      {/* Forecast Query Form + Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Custom Forecast Query</h3>
          
          <form onSubmit={handleRunForecast} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Target Production (tpd)</label>
              <input
                type="number"
                name="target_production_tonnes"
                value={formState.target_production_tonnes}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Active Shift Hours</label>
              <input
                type="number"
                name="operating_hours"
                value={formState.operating_hours}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Active Heavy Machines</label>
              <input
                type="number"
                name="active_machines_count"
                value={formState.active_machines_count}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Maintenance Delay (hrs)</label>
              <input
                type="number"
                step="0.5"
                name="maintenance_delay_hours"
                value={formState.maintenance_delay_hours}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Rainfall (mm)</label>
              <input
                type="number"
                name="rainfall_mm"
                value={formState.rainfall_mm}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl transition shadow-md shadow-cyan-500/20"
            >
              {loading ? 'Calculating Forecast...' : 'Run Forecast Query'}
            </button>
          </form>
        </div>

        {/* Historical & Forecast Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Historical Production vs Daily Forecast Curve</h3>
          <div className="h-72">
            {historyData && historyData.history ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData.history}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="actual_production_tonnes" name="Actual Production (tonnes)" stroke="#06b6d4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="target_production_tonnes" name="Target Production (tonnes)" stroke="#10b981" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">Loading chart...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
