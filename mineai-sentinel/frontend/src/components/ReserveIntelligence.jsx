import React, { useState } from 'react';
import { Layers, Sparkles, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function ReserveIntelligence({ reserveData }) {
  const [formData, setFormData] = useState({
    depth_m: 120.0,
    rock_density_gt_m3: 3.4,
    drill_hole_density: 10,
    elevation_m: 340.0,
    soil_moisture_pct: 35.0,
    ndvi_index: 0.45,
    lst_temp_c: 28.0,
    annual_rainfall_mm: 1200.0,
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await api.predictReserve(formData);
      setPrediction(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    handlePredict();
  }, []);

  const blocks = reserveData ? reserveData.blocks || [] : [];
  const filteredBlocks = blocks.filter(b => 
    b.block_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.block_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-white flex items-center space-x-2">
          <Layers className="h-5 w-5 text-cyan-400" />
          <span>ML-Based Reserve Estimation Intelligence</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Predict ore body tonnage, manganese grade percentage, and recoverable reserves using sub-surface indicators and satellite telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ML Reserve Predictor Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>Interactive Reserve Predictor</span>
            </h3>
            <span className="text-[11px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">
              Random Forest Model
            </span>
          </div>

          <form onSubmit={handlePredict} className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Drill Depth (m)</label>
                <input
                  type="number"
                  name="depth_m"
                  value={formData.depth_m}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Rock Density (g/cm³)</label>
                <input
                  type="number"
                  step="0.1"
                  name="rock_density_gt_m3"
                  value={formData.rock_density_gt_m3}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Drill Holes/ha</label>
                <input
                  type="number"
                  name="drill_hole_density"
                  value={formData.drill_hole_density}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Elevation (m)</label>
                <input
                  type="number"
                  name="elevation_m"
                  value={formData.elevation_m}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Soil Moisture (%)</label>
                <input
                  type="number"
                  name="soil_moisture_pct"
                  value={formData.soil_moisture_pct}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">NDVI Index</label>
                <input
                  type="number"
                  step="0.01"
                  name="ndvi_index"
                  value={formData.ndvi_index}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition duration-150 shadow-md shadow-cyan-500/20"
            >
              {loading ? 'Predicting Reserve...' : 'Run ML Estimation Prediction'}
            </button>
          </form>

          {/* Prediction Output Results */}
          {prediction && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
              <div className="text-xs font-semibold text-cyan-400 flex items-center space-x-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>ML Reserve Model Output</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-400">Est Tonnage:</span>
                  <div className="font-bold text-white text-sm">{prediction.predicted_tonnage_mt} MT</div>
                </div>
                <div>
                  <span className="text-slate-400">Predicted Mn Grade:</span>
                  <div className="font-bold text-cyan-400 text-sm">{prediction.predicted_mn_grade_pct}% Mn</div>
                </div>
                <div>
                  <span className="text-slate-400">Recoverable Ore:</span>
                  <div className="font-bold text-emerald-400 text-sm">{prediction.predicted_recoverable_mt} MT</div>
                </div>
                <div>
                  <span className="text-slate-400">Confidence Score:</span>
                  <div className="font-bold text-indigo-400 text-sm">{prediction.confidence_score_pct}%</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Geological Block Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Geological Mine Block Inventory</h3>
            <input
              type="text"
              placeholder="Search block ID or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-white px-3 py-1.5 focus:outline-none focus:border-cyan-500 w-56"
            />
          </div>

          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950 text-slate-400 sticky top-0">
                <tr>
                  <th className="p-2.5 rounded-l-lg">Block ID</th>
                  <th className="p-2.5">Block Name</th>
                  <th className="p-2.5">Est Tonnage (MT)</th>
                  <th className="p-2.5">Recoverable (MT)</th>
                  <th className="p-2.5">Mn Grade %</th>
                  <th className="p-2.5 rounded-r-lg">Depth (m)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBlocks.map((b) => (
                  <tr key={b.block_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-2.5 font-mono font-semibold text-cyan-400">{b.block_id}</td>
                    <td className="p-2.5 text-slate-200 font-medium">{b.block_name}</td>
                    <td className="p-2.5 text-white font-mono">{b.est_tonnage_mt}</td>
                    <td className="p-2.5 text-emerald-400 font-mono">{b.recoverable_tonnage_mt}</td>
                    <td className="p-2.5 text-cyan-300 font-mono font-bold">{b.est_mn_grade_pct}%</td>
                    <td className="p-2.5 text-slate-400 font-mono">{b.depth_m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
