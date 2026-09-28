import React from 'react';
import { CloudRain, Thermometer, Droplets, Leaf, ShieldAlert, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function SatelliteEnvironment({ envData }) {
  const telemetry = envData ? envData.environmental_telemetry || [] : [];
  const latest = telemetry.length > 0 ? telemetry[telemetry.length - 1] : {
    rainfall_mm: 22.5,
    soil_moisture_pct: 55.0,
    ndvi: 0.42,
    land_surface_temp_c: 31.5,
    haul_road_condition: 'SLIPPERY',
    environmental_risk_score: 48.0
  };

  const envKpis = [
    { label: 'Rainfall Depth', value: `${latest.rainfall_mm} mm`, icon: CloudRain, color: 'text-cyan-400' },
    { label: 'Soil Moisture Ratio', value: `${latest.soil_moisture_pct}%`, icon: Droplets, color: 'text-indigo-400' },
    { label: 'Vegetation NDVI', value: `${latest.ndvi}`, icon: Leaf, color: 'text-emerald-400' },
    { label: 'Land Temp (LST)', value: `${latest.land_surface_temp_c}°C`, icon: Thermometer, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-white flex items-center space-x-2">
          <CloudRain className="h-5 w-5 text-cyan-400" />
          <span>Satellite & Environmental Conditions Panel</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Satellite telemetry feed monitoring precipitation, soil moisture, vegetation cover index, and haul-road stability.
        </p>
      </div>

      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2.5 text-cyan-300 text-xs">
        <b>Data Architecture Notice:</b> Currently powered by Synthetic Satellite Data Generator. Designed to connect directly with Sentinel-2 / Landsat-8 open satellite APIs for live production deployment.
      </div>

      {/* Environmental KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {envKpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{kpi.label}</span>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-bold text-white font-mono mt-3">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Haul Road Status & Risk Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Haul Road Stability Status</h3>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs text-slate-400">Current Surface State:</div>
              <div className={`text-lg font-bold font-mono ${
                latest.haul_road_condition === 'HAZARDOUS' ? 'text-rose-400' :
                latest.haul_road_condition === 'SLIPPERY' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {latest.haul_road_condition}
              </div>
              <p className="text-xs text-slate-400">
                Heavy precipitation impacts pit gradient traction for haulage trucks.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Environmental Risk Score:</span>
            <span className="font-bold text-amber-400 font-mono text-sm">{latest.environmental_risk_score}/100</span>
          </div>
        </div>

        {/* Environmental Telemetry Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">30-Day Rainfall & Environmental Hazard Score</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetry}>
                <defs>
                  <linearGradient id="colorEnv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Area type="monotone" dataKey="environmental_risk_score" name="Env Risk Score" stroke="#38bdf8" fillOpacity={1} fill="url(#colorEnv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
