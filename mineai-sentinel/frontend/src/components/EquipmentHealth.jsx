import React, { useState } from 'react';
import { Truck, AlertTriangle, ShieldCheck, Fuel, Wrench } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function EquipmentHealth({ equipmentData }) {
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fleet = equipmentData ? equipmentData.equipment || [] : [];

  const filteredFleet = fleet.filter(eq => {
    const matchesRisk = filterRisk === 'ALL' || eq.downtime_risk === filterRisk;
    const matchesSearch = eq.equipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          eq.equipment_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          eq.block_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-white flex items-center space-x-2">
          <Truck className="h-5 w-5 text-cyan-400" />
          <span>Heavy Equipment Fleet Telemetry & Health Analytics</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Real-time monitoring of haul trucks, hydraulic excavators, blast drills, and loaders to prevent breakdown delays.
        </p>
      </div>

      {/* Fleet Controls & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Filter equipment ID, type, or mine block..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-white px-3 py-1.5 focus:outline-none focus:border-cyan-500 w-64"
        />

        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map(risk => (
            <button
              key={risk}
              onClick={() => setFilterRisk(risk)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterRisk === risk 
                  ? 'bg-cyan-500 text-slate-950' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {risk} Risk
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="overflow-x-auto max-h-[450px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950 text-slate-400 sticky top-0">
              <tr>
                <th className="p-2.5 rounded-l-lg">Equipment ID</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Block ID</th>
                <th className="p-2.5">Total Hours</th>
                <th className="p-2.5">Downtime (hrs)</th>
                <th className="p-2.5">Breakdowns</th>
                <th className="p-2.5">Fuel (L/h)</th>
                <th className="p-2.5">Availability %</th>
                <th className="p-2.5 rounded-r-lg">Risk Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredFleet.map((eq) => (
                <tr key={eq.equipment_id} className="hover:bg-slate-800/40 transition">
                  <td className="p-2.5 font-mono font-semibold text-cyan-400">{eq.equipment_id}</td>
                  <td className="p-2.5 text-slate-200 font-medium">{eq.equipment_type}</td>
                  <td className="p-2.5 text-slate-400 font-mono">{eq.block_id}</td>
                  <td className="p-2.5 text-slate-300 font-mono">{eq.operating_hours_total} h</td>
                  <td className="p-2.5 text-rose-400 font-mono">{eq.downtime_hours_month} h</td>
                  <td className="p-2.5 text-amber-400 font-mono font-bold">{eq.breakdown_frequency}</td>
                  <td className="p-2.5 text-slate-300 font-mono">{eq.fuel_efficiency_lph} L/h</td>
                  <td className="p-2.5 font-mono font-bold text-emerald-400">{eq.availability_pct}%</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      eq.downtime_risk === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      eq.downtime_risk === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {eq.downtime_risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
