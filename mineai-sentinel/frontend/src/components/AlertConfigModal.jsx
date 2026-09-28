import React, { useState } from 'react';
import { X, Settings, Check, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function AlertConfigModal({ config, onClose, onSave }) {
  const [formData, setFormData] = useState({
    fleet_availability_threshold: config?.fleet_availability_threshold ?? 75.0,
    production_gap_threshold: config?.production_gap_threshold ?? 150.0,
    rainfall_threshold: config?.rainfall_threshold ?? 20.0,
    risk_score_high: config?.risk_score_high ?? 60.0,
    risk_score_critical: config?.risk_score_critical ?? 80.0,
    ore_availability_threshold: config?.ore_availability_threshold ?? 30.0,
    blasting_delay_threshold: config?.blasting_delay_threshold ?? 2.0,
    downtime_hours_threshold: config?.downtime_hours_threshold ?? 4.0,
    shortfall_prob_threshold: config?.shortfall_prob_threshold ?? 50.0,
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: parseFloat(val) || 0 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateAlertConfig(formData);
      onSave(updated);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configurable Alert Thresholds</h3>
              <p className="text-xs text-slate-400">Customize demonstration risk trigger parameters</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Fleet Availability Min %</label>
              <input
                type="number"
                step="1"
                value={formData.fleet_availability_threshold}
                onChange={(e) => handleChange('fleet_availability_threshold', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Production Gap Threshold (TPD)</label>
              <input
                type="number"
                step="10"
                value={formData.production_gap_threshold}
                onChange={(e) => handleChange('production_gap_threshold', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Rainfall Hazard Depth (mm)</label>
              <input
                type="number"
                step="5"
                value={formData.rainfall_threshold}
                onChange={(e) => handleChange('rainfall_threshold', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Shortfall Probability Min %</label>
              <input
                type="number"
                step="5"
                value={formData.shortfall_prob_threshold}
                onChange={(e) => handleChange('shortfall_prob_threshold', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">High Risk Score Threshold (0-100)</label>
              <input
                type="number"
                step="5"
                value={formData.risk_score_high}
                onChange={(e) => handleChange('risk_score_high', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Critical Risk Score Threshold (0-100)</label>
              <input
                type="number"
                step="5"
                value={formData.risk_score_critical}
                onChange={(e) => handleChange('risk_score_critical', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Blasting Clearance Delay (hrs)</label>
              <input
                type="number"
                step="0.5"
                value={formData.blasting_delay_threshold}
                onChange={(e) => handleChange('blasting_delay_threshold', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Equipment Downtime Threshold (hrs)</label>
              <input
                type="number"
                step="0.5"
                value={formData.downtime_hours_threshold}
                onChange={(e) => handleChange('downtime_hours_threshold', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
            <b>Note:</b> These thresholds configure prototype demonstration alerts and do not represent official MOIL operational thresholds.
          </div>

          <div className="flex justify-end space-x-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center space-x-1.5"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Save & Re-evaluate Alerts</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
