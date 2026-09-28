import React, { useState, useEffect } from 'react';
import { 
  BellRing, ShieldAlert, AlertTriangle, CheckCircle2, Filter, 
  Search, Sliders, Settings, RefreshCw, MapPin, Clock, Eye, Check
} from 'lucide-react';
import { api } from '../api';
import AlertDetailModal from './AlertDetailModal';
import AlertConfigModal from './AlertConfigModal';

export default function AlertCenter({ onNavigateToSimulator }) {
  const [alerts, setAlerts] = useState([]);
  const [summaryCounts, setSummaryCounts] = useState({
    total_active_count: 0,
    critical_count: 0,
    high_count: 0,
    medium_count: 0,
    low_count: 0,
  });

  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [blockFilter, setBlockFilter] = useState('');

  const loadAlertsData = async () => {
    setLoading(true);
    try {
      const [allRes, activeRes, cfgRes] = await Promise.allSettled([
        api.getAlerts(),
        api.getActiveAlerts(),
        api.getAlertConfig()
      ]);

      if (allRes.status === 'fulfilled') {
        setAlerts(allRes.value);
      }
      if (activeRes.status === 'fulfilled') {
        setSummaryCounts(activeRes.value);
      }
      if (cfgRes.status === 'fulfilled') {
        setConfig(cfgRes.value);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertsData();
  }, []);

  const handleAcknowledge = async (id) => {
    try {
      await api.acknowledgeAlert(id);
      loadAlertsData();
      if (selectedAlert?.id === id) {
        setSelectedAlert(prev => ({ ...prev, status: 'ACKNOWLEDGED' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.resolveAlert(id);
      loadAlertsData();
      if (selectedAlert?.id === id) {
        setSelectedAlert(prev => ({ ...prev, status: 'RESOLVED' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateAction = (simulatorParams) => {
    if (onNavigateToSimulator) {
      onNavigateToSimulator(simulatorParams);
    }
    setSelectedAlert(null);
  };

  // Filtered Alert List
  const filteredAlerts = alerts.filter(alert => {
    if (statusFilter !== 'ALL' && alert.status !== statusFilter) {
      if (statusFilter === 'ACTIVE' && alert.status === 'ACKNOWLEDGED') {
        // Keep acknowledged in active view
      } else {
        return false;
      }
    }
    if (severityFilter !== 'ALL' && alert.severity !== severityFilter) return false;
    if (typeFilter !== 'ALL' && alert.alert_type !== typeFilter) return false;
    if (blockFilter && !alert.mine_block.toLowerCase().includes(blockFilter.toLowerCase()) && !alert.title.toLowerCase().includes(blockFilter.toLowerCase())) return false;
    return true;
  });

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return { bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40', icon: '🔴', label: 'CRITICAL' };
      case 'HIGH':
        return { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: '🟠', label: 'HIGH' };
      case 'MEDIUM':
        return { bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', icon: '🟡', label: 'MEDIUM' };
      default:
        return { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', icon: '🟢', label: 'LOW' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <BellRing className="h-5 w-5 text-rose-400 animate-pulse" />
            <span>Alert & Early Warning Command Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Proactive risk detection, root-cause diagnostics, and decision-support recommendations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
          >
            <Settings className="h-4 w-4 text-cyan-400" />
            <span>Config Thresholds</span>
          </button>

          <button
            onClick={loadAlertsData}
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-md shadow-cyan-500/20"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Alerts</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div 
          onClick={() => { setStatusFilter('ACTIVE'); setSeverityFilter('ALL'); }}
          className={`p-4 rounded-2xl border cursor-pointer transition ${statusFilter === 'ACTIVE' && severityFilter === 'ALL' ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Active Alerts</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{summaryCounts.total_active_count}</div>
        </div>

        <div 
          onClick={() => { setStatusFilter('ACTIVE'); setSeverityFilter('CRITICAL'); }}
          className={`p-4 rounded-2xl border cursor-pointer transition ${severityFilter === 'CRITICAL' ? 'bg-rose-500/20 border-rose-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
        >
          <div className="text-[11px] font-semibold text-rose-400 uppercase flex items-center gap-1">
            <span>🔴</span> Critical
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-1">{summaryCounts.critical_count}</div>
        </div>

        <div 
          onClick={() => { setStatusFilter('ACTIVE'); setSeverityFilter('HIGH'); }}
          className={`p-4 rounded-2xl border cursor-pointer transition ${severityFilter === 'HIGH' ? 'bg-amber-500/20 border-amber-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
        >
          <div className="text-[11px] font-semibold text-amber-400 uppercase flex items-center gap-1">
            <span>🟠</span> High
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{summaryCounts.high_count}</div>
        </div>

        <div 
          onClick={() => { setStatusFilter('ACTIVE'); setSeverityFilter('MEDIUM'); }}
          className={`p-4 rounded-2xl border cursor-pointer transition ${severityFilter === 'MEDIUM' ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
        >
          <div className="text-[11px] font-semibold text-yellow-400 uppercase flex items-center gap-1">
            <span>🟡</span> Medium
          </div>
          <div className="text-2xl font-bold text-yellow-400 font-mono mt-1">{summaryCounts.medium_count}</div>
        </div>

        <div 
          onClick={() => { setStatusFilter('ACTIVE'); setSeverityFilter('LOW'); }}
          className={`p-4 rounded-2xl border cursor-pointer transition ${severityFilter === 'LOW' ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
        >
          <div className="text-[11px] font-semibold text-emerald-400 uppercase flex items-center gap-1">
            <span>🟢</span> Low
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{summaryCounts.low_count}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Status filter buttons */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex space-x-1">
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${statusFilter === 'ACTIVE' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Active ({summaryCounts.total_active_count})
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${statusFilter === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Resolved
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${statusFilter === 'ALL' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All Alerts
            </button>
          </div>

          {/* Severity Dropdown */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">🔴 Critical Only</option>
            <option value="HIGH">🟠 High Only</option>
            <option value="MEDIUM">🟡 Medium Only</option>
            <option value="LOW">🟢 Low Only</option>
          </select>

          {/* Alert Type Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium"
          >
            <option value="ALL">All Alert Types</option>
            <option value="PRODUCTION_SHORTFALL">Production Shortfall</option>
            <option value="EQUIPMENT">Equipment Telemetry</option>
            <option value="WEATHER">Weather / Environment</option>
            <option value="BLASTING_DELAY">Blasting Delay</option>
            <option value="LOW_ORE_AVAILABILITY">Low Ore Availability</option>
            <option value="OPERATIONAL_RISK">Operational Risk</option>
          </select>
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter by mine block or title..."
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Alert Cards Grid */}
      <div className="space-y-3.5">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => {
            const badge = getSeverityBadge(alert.severity);
            return (
              <div 
                key={alert.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition duration-150 shadow-md space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 mt-0.5">
                      <ShieldAlert className={`h-5 w-5 ${alert.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}`} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>
                        <span className="text-xs text-cyan-400 font-semibold bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                          {alert.mine_block}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          alert.status === 'ACTIVE' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' :
                          alert.status === 'ACKNOWLEDGED' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        }`}>
                          {alert.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white tracking-tight mt-1">{alert.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 text-[10px] block">RISK SCORE</span>
                      <span className="font-bold text-amber-400">{alert.risk_score}/100</span>
                    </div>
                    <div className="border-l border-slate-800 pl-4">
                      <span className="text-slate-500 text-[10px] block">PROBABILITY</span>
                      <span className="font-bold text-rose-400">{alert.probability}%</span>
                    </div>
                  </div>
                </div>

                {/* Message & Causes */}
                <div className="text-xs text-slate-300 space-y-2">
                  <p className="font-medium text-slate-200">{alert.message}</p>
                  
                  {alert.causes && alert.causes.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {alert.causes.slice(0, 3).map((c, idx) => (
                        <span key={idx} className="bg-slate-950 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]">
                          {c.factor}: <b className="text-slate-200">{c.value}</b>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-md shadow-cyan-500/10 flex items-center space-x-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Full 4-Question Details</span>
                    </button>

                    <button
                      onClick={() => handleSimulateAction(alert.simulator_params)}
                      className="bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs px-3 py-2 rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
                    >
                      <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Simulate Action</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    {alert.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Resolve</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
            No alerts match the selected filter criteria.
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={handleAcknowledge}
          onResolve={handleResolve}
          onSimulate={handleSimulateAction}
        />
      )}

      {/* Config Thresholds Modal */}
      {showConfigModal && (
        <AlertConfigModal
          config={config}
          onClose={() => setShowConfigModal(false)}
          onSave={(updated) => { setConfig(updated); loadAlertsData(); }}
        />
      )}

    </div>
  );
}
