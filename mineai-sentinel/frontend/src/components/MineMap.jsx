import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ShieldAlert, Layers, Activity, ArrowRight, Info } from 'lucide-react';
import L from 'leaflet';

// Fix default marker icon issues in Leaflet with Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function MineMap({ mapData }) {
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [filterRisk, setFilterRisk] = useState('ALL');

  const centerLat = 21.8150;
  const centerLon = 80.1850;

  if (!mapData || !mapData.features) {
    return <div className="p-8 text-center text-slate-400">Loading Geospatial Mine Map Data...</div>;
  }

  const filteredFeatures = mapData.features.filter(f => {
    if (filterRisk === 'ALL') return true;
    return f.properties.risk_level === filterRisk;
  });

  const getMarkerColor = (risk) => {
    if (risk === 'HIGH') return '#ef4444';
    if (risk === 'MEDIUM') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-cyan-400" />
            <span>Interactive Mine Reserve & Block Map</span>
          </h2>
          <p className="text-xs text-slate-400">
            Geospatial mapping of manganese ore blocks across Balaghat & Ukwa mining sectors.
          </p>
        </div>

        {/* Risk Filter Buttons */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map(risk => (
            <button
              key={risk}
              onClick={() => setFilterRisk(risk)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition duration-150 ${
                filterRisk === risk 
                  ? 'bg-cyan-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {risk}
            </button>
          ))}
        </div>
      </div>

      {/* Synthetic Coordinates Disclaimer Banner */}
      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2.5 flex items-center space-x-2 text-cyan-300 text-xs">
        <Info className="h-4 w-4 text-cyan-400 shrink-0" />
        <span>{mapData.demo_disclaimer || 'Synthetic demonstration coordinates — not actual MOIL operational coordinates.'}</span>
      </div>

      {/* Map Layout + Sidebar Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Map Container */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-2 h-[520px] relative overflow-hidden">
          <MapContainer 
            center={[centerLat, centerLon]} 
            zoom={11} 
            scrollWheelZoom={true} 
            className="h-full w-full rounded-xl z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredFeatures.map((feat) => {
              const props = feat.properties;
              const coords = feat.geometry.coordinates; // [lon, lat]
              const color = getMarkerColor(props.risk_level);

              return (
                <CircleMarker
                  key={props.block_id}
                  center={[coords[1], coords[0]]}
                  radius={props.risk_level === 'HIGH' ? 12 : 9}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.7,
                    weight: 2
                  }}
                  eventHandlers={{
                    click: () => setSelectedBlock(props)
                  }}
                >
                  <Popup>
                    <div className="p-1 text-slate-950">
                      <div className="font-bold text-sm">{props.block_name} ({props.block_id})</div>
                      <div className="text-xs mt-1">Est Tonnage: <b>{props.est_tonnage_mt} MT</b></div>
                      <div className="text-xs">Mn Grade: <b>{props.est_mn_grade_pct}%</b></div>
                      <div className="text-xs mt-1">Risk: <span style={{ color }}>{props.risk_level}</span></div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Selected Block Inspector Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center space-x-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Block Inspector</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Click a mine block on the map to inspect telemetry</p>

            {selectedBlock ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs font-semibold text-cyan-400 font-mono">{selectedBlock.block_id}</div>
                  <div className="text-base font-bold text-white mt-0.5">{selectedBlock.block_name}</div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                    <div>
                      <span className="text-slate-400">Est Tonnage:</span>
                      <div className="font-semibold text-slate-200">{selectedBlock.est_tonnage_mt} MT</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Recoverable:</span>
                      <div className="font-semibold text-emerald-400">{selectedBlock.recoverable_tonnage_mt} MT</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Mn Grade:</span>
                      <div className="font-semibold text-cyan-400">{selectedBlock.est_mn_grade_pct}% Mn</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Depth:</span>
                      <div className="font-semibold text-slate-200">{selectedBlock.depth_m} m</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Risk Rating:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      selectedBlock.risk_level === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 
                      selectedBlock.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {selectedBlock.risk_level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Priority Tier:</span>
                    <span className="font-mono text-cyan-300 font-semibold">{selectedBlock.production_priority}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl text-xs">
                Select any mine marker on the map to view detailed geological indicators.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
            Total mapped mine blocks: {mapData.features.length}
          </div>
        </div>
      </div>
    </div>
  );
}
