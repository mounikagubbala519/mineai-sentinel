import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw, CheckCircle2, ShieldAlert, Eye, AlertCircle, Clock, Filter } from 'lucide-react';
import { api } from '../api';
import AlertDetailModal from './AlertDetailModal';

export default function AlertHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Fetch all alerts to provide a comprehensive audit log history
      const data = await api.getAlerts();
      setHistory(data);
    } catch (err) {
      console.error('[Alert History] Failed to load alert history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // Live real-time polling every 5 seconds
    const timer = setInterval(() => {
      loadHistory();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Compute summary stats
  const totalCount = history.length;
  const resolvedCount = history.filter(h => h.status === 'RESOLVED').length;
  const ackCount = history.filter(h => h.status === 'ACKNOWLEDGED').length;
  const activeCount = history.filter(h => h.status === 'ACTIVE').length;
  const avgRisk = totalCount > 0 ? (history.reduce((acc, curr) => acc + (curr.risk_score || 0), 0) / totalCount).toFixed(1) : '0.0';

  const filtered = history.filter(item => {
    if (statusTab !== 'ALL' && item.status !== statusTab) return false;
    if (severityFilter !== 'ALL' && item.severity !== severityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.mine_block.toLowerCase().includes(q) ||
        item.alert_type.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <History className="h-5 w-5 text-cyan-400" />
            <span>Alert History & Operational Audit Timeline</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time live audit log of resolved incidents, acknowledged alarms, and system risk events. Auto-refreshes every 5 seconds.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative min-w-[240px]">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by block, type, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={loadHistory}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 transition flex items-center space-x-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live Log</span>
          </button>
        </div>
      </div>

      {/* Summary Statistic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusTab('ALL')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${statusTab === 'ALL' ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Audit Records</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{totalCount}</div>
        </div>

        <div 
          onClick={() => setStatusTab('RESOLVED')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${statusTab === 'RESOLVED' ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
        >
          <div className="text-[11px] font-semibold text-emerald-400 uppercase flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Resolved Archive
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{resolvedCount}</div>
        </div>

        <div 
          onClick={() => setStatusTab('ACKNOWLEDGED')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${statusTab === 'ACKNOWLEDGED' ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
        >
          <div className="text-[11px] font-semibold text-amber-400 uppercase flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-amber-400" /> Acknowledged Alarms
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{ackCount}</div>
        </div>

        <div 
          onClick={() => setStatusTab('ACTIVE')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${statusTab === 'ACTIVE' ? 'bg-rose-500/10 border-rose-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
        >
          <div className="text-[11px] font-semibold text-rose-400 uppercase flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" /> Active Operational Alarms
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-1">{activeCount}</div>
        </div>
      </div>

      {/* Filter Tabs & Severity Dropdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex space-x-1">
            <button
              onClick={() => setStatusTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${statusTab === 'ALL' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All Records ({totalCount})
            </button>
            <button
              onClick={() => setStatusTab('RESOLVED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${statusTab === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Resolved ({resolvedCount})
            </button>
            <button
              onClick={() => setStatusTab('ACKNOWLEDGED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${statusTab === 'ACKNOWLEDGED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Acknowledged ({ackCount})
            </button>
            <button
              onClick={() => setStatusTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${statusTab === 'ACTIVE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Active ({activeCount})
            </button>
          </div>

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
        </div>

        <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live Data Feed Active</span>
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="p-3.5">Alert ID</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Alert Type</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Mine Block</th>
                <th className="p-3.5">Risk Index</th>
                <th className="p-3.5">Live Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length > 0 ? (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">
                      {item.id}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-3.5 font-semibold text-white">
                      {item.alert_type}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        item.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="p-3.5 text-cyan-300 font-medium">
                      {item.mine_block}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-amber-400">
                      {Number(item.risk_score).toFixed(1)} / 100
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-fit ${
                        item.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        item.status === 'ACKNOWLEDGED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {item.status === 'RESOLVED' ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> :
                         item.status === 'ACKNOWLEDGED' ? <Clock className="h-3 w-3 text-amber-400" /> :
                         <AlertCircle className="h-3 w-3 text-rose-400" />}
                        <span>{item.status}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedAlert(item)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-700 transition inline-flex items-center space-x-1"
                      >
                        <Eye className="h-3 w-3 text-cyan-400" />
                        <span>Inspect Log</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">
                    No historical alert records found matching the current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={loadHistory}
          onResolve={loadHistory}
          onSimulate={() => {}}
        />
      )}
    </div>
  );
}
