import React from 'react';
import { 
  X, AlertTriangle, ShieldAlert, CheckCircle2, Clock, MapPin, 
  TrendingUp, Activity, HelpCircle, Sliders, ArrowRight, Check
} from 'lucide-react';

export default function AlertDetailModal({ alert, onClose, onAcknowledge, onResolve, onSimulate }) {
  if (!alert) return null;

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return { bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40', icon: '🔴', label: 'CRITICAL SEVERITY' };
      case 'HIGH':
        return { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: '🟠', label: 'HIGH SEVERITY' };
      case 'MEDIUM':
        return { bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', icon: '🟡', label: 'MEDIUM SEVERITY' };
      default:
        return { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', icon: '🟢', label: 'LOW SEVERITY' };
    }
  };

  const badge = getSeverityBadge(alert.severity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mt-0.5">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                  <span>{badge.icon}</span>
                  <span>{badge.label}</span>
                </span>
                <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-mono">
                  ID: {alert.id}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  alert.status === 'ACTIVE' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  alert.status === 'ACKNOWLEDGED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {alert.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-1.5">{alert.title}</h2>
              <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  {alert.mine_block}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {new Date(alert.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content — 4 Question Framework */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* QUESTION 1: WHAT HAPPENED? */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              <HelpCircle className="h-4 w-4 text-cyan-400" />
              <span>1. WHAT Happened?</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {alert.message}
            </p>

            {alert.expected_impact && Object.keys(alert.expected_impact).length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {Object.entries(alert.expected_impact).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-bold text-white font-mono mt-0.5 block">{String(val)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QUESTION 2: WHY IS IT HAPPENING? (XAI & Causes) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <Activity className="h-4 w-4 text-amber-400" />
              <span>2. WHY is it happening? (Root Cause & XAI Breakdown)</span>
            </div>

            {/* XAI Contributing Factors Progress Bars */}
            {alert.xai_factors && alert.xai_factors.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-xs text-slate-400 font-medium block">Machine Learning Feature Importance Contribution (%):</span>
                {alert.xai_factors.map((item, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-300">{item.factor}</span>
                      <span className="font-mono text-cyan-400 font-bold">{item.percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Causes List */}
            {alert.causes && alert.causes.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-xs text-slate-400 font-medium block">Observed Telemetry Metrics:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {alert.causes.map((c, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between items-center">
                      <span className="text-slate-300">{c.factor}</span>
                      <span className="font-mono font-bold text-amber-400">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* QUESTION 3: HOW SERIOUS IS IT? */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-rose-400 uppercase tracking-wider">
              <TrendingUp className="h-4 w-4 text-rose-400" />
              <span>3. HOW Serious is it? (Risk & Probability)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Composite Operational Risk Score</span>
                  <span className="text-2xl font-bold text-white font-mono mt-0.5 block">{alert.risk_score} / 100</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg}`}>
                  {alert.severity}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Shortfall Probability</span>
                  <span className="text-2xl font-bold text-rose-400 font-mono mt-0.5 block">{alert.probability}%</span>
                </div>
                <div className="text-xs text-slate-400 font-mono text-right">
                  High Risk Threshold: 50%
                </div>
              </div>
            </div>
          </div>

          {/* QUESTION 4: WHAT SHOULD THE OPERATOR DO? */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>4. WHAT Should the Operator Do? (AI Recommended Actions)</span>
            </div>

            <div className="space-y-2">
              {alert.recommended_actions && alert.recommended_actions.length > 0 ? (
                alert.recommended_actions.map((act, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-start space-x-2.5">
                    <span className="bg-emerald-500/20 text-emerald-400 font-bold rounded-lg w-5 h-5 flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-slate-200 leading-relaxed font-medium">{act}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">Proceed with standard mine operating procedures.</div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md sticky bottom-0 rounded-b-3xl flex flex-wrap items-center justify-between gap-3">
          
          <button
            onClick={() => onSimulate(alert.simulator_params)}
            className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-cyan-500/20 flex items-center space-x-2"
          >
            <Sliders className="h-4 w-4" />
            <span>Simulate Corrective Action</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center space-x-2.5">
            {alert.status === 'ACTIVE' && (
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center space-x-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Acknowledge Alert</span>
              </button>
            )}

            {alert.status !== 'RESOLVED' && (
              <button
                onClick={() => onResolve(alert.id)}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center space-x-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Resolve Alert</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition border border-slate-700"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
