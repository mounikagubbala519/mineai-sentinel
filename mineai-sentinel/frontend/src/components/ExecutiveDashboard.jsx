import React from 'react';
import { 
  TrendingUp, AlertTriangle, Layers, Truck, CloudRain, 
  ArrowUpRight, ArrowDownRight, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell 
} from 'recharts';

export default function ExecutiveDashboard({ summaryData, historyData, onNavigate }) {
  if (!summaryData) {
    return <div className="p-8 text-center text-slate-400">Loading Executive Telemetry...</div>;
  }

  const kpis = [
    {
      title: 'Estimated Reserves',
      value: `${(summaryData.total_estimated_reserves_mt / 1000).toFixed(2)} M MT`,
      subtitle: `Recoverable: ${(summaryData.recoverable_reserves_mt / 1000).toFixed(2)} M MT`,
      icon: Layers,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Daily Target vs Actual',
      value: `${summaryData.current_daily_production_tonnes} tpd`,
      subtitle: `Target: ${summaryData.target_daily_production_tonnes} tpd`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Forecasted Gap',
      value: `${summaryData.production_gap_tonnes} tonnes`,
      subtitle: `Shortfall Prob: ${summaryData.shortfall_probability_pct}%`,
      icon: AlertTriangle,
      color: summaryData.shortfall_probability_pct > 50 ? 'text-rose-400' : 'text-amber-400',
      bgColor: summaryData.shortfall_probability_pct > 50 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Fleet Availability',
      value: `${summaryData.equipment_availability_pct}%`,
      subtitle: `Env Risk Index: ${summaryData.environmental_risk_score}`,
      icon: Truck,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20'
    }
  ];

  const riskPieData = [
    { name: 'Low Risk', value: 45, color: '#10b981' },
    { name: 'Medium Risk', value: 35, color: '#f59e0b' },
    { name: 'High Risk', value: 20, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${summaryData.overall_risk_level === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-white">Overall Operational Risk Level:</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${summaryData.overall_risk_level === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'}`}>
                {summaryData.overall_risk_level} (Score: {summaryData.overall_risk_score}/100)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Top contributor: Equipment Breakdown Downtime (+24 pts) and Rainfall Delays (+18 pts).
            </p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('shortfall')}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs px-4 py-2 rounded-xl transition duration-150 flex items-center space-x-1 shadow-md shadow-cyan-500/20"
        >
          <span>Risk Diagnostics</span>
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className={`p-5 rounded-2xl border ${kpi.bgColor} backdrop-blur-sm relative overflow-hidden`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{kpi.title}</span>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-white tracking-tight font-mono">{kpi.value}</div>
                <div className="text-xs text-slate-400 mt-1">{kpi.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Trends Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Daily Ore Production Trends vs Target</h3>
              <p className="text-xs text-slate-400">Historical 60-day operational telemetry</p>
            </div>
            <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
              Balaghat / Ukwa Sector
            </span>
          </div>
          <div className="h-64">
            {historyData && historyData.history ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData.history}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="actual_production_tonnes" name="Actual (tpd)" stroke="#06b6d4" fillOpacity={1} fill="url(#colorActual)" />
                  <Area type="monotone" dataKey="target_production_tonnes" name="Target (tpd)" stroke="#10b981" strokeDasharray="3 3" fillOpacity={1} fill="url(#colorTarget)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">Loading production chart...</div>
            )}
          </div>
        </div>

        {/* Active Alerts Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Active Risk Alerts</h3>
            <p className="text-xs text-slate-400 mb-4">Real-time system telemetry notifications</p>

            <div className="space-y-3">
              {summaryData.active_alerts ? summaryData.active_alerts.map((alert) => (
                <div key={alert.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
                  <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${alert.severity === 'HIGH' ? 'text-rose-400' : 'text-amber-400'}`} />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{alert.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{alert.message}</div>
                  </div>
                </div>
              )) : (
                <div className="text-xs text-slate-500">No active alerts.</div>
              )}
            </div>
          </div>

          <button 
            onClick={() => onNavigate('recommendations')}
            className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-medium text-xs py-2.5 rounded-xl border border-slate-700 transition duration-150 flex items-center justify-center space-x-1.5"
          >
            <span>View Recommended Corrective Actions</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
