import React from 'react';
import { 
  LayoutDashboard, Map, Layers, TrendingUp, AlertTriangle, 
  Truck, CloudRain, Sliders, Lightbulb, Cpu, BellRing, History
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'alerts', label: 'Alert Center', icon: BellRing },
    { id: 'map', label: 'Mine Reserve Map', icon: Map },
    { id: 'reserves', label: 'Reserve Intelligence', icon: Layers },
    { id: 'forecast', label: 'Production Forecast', icon: TrendingUp },
    { id: 'shortfall', label: 'Shortfall Risk', icon: AlertTriangle },
    { id: 'equipment', label: 'Equipment Health', icon: Truck },
    { id: 'environment', label: 'Satellite & Environment', icon: CloudRain },
    { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
    { id: 'recommendations', label: 'AI Recommendations', icon: Lightbulb },
    { id: 'history', label: 'Alert History', icon: History },
    { id: 'performance', label: 'Model Performance', icon: Cpu },
  ];

  return (
    <aside className="w-64 bg-slate-900/80 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Decision Support Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition duration-150 ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
        MineAI Sentinel v1.0 • Hackathon Prototype
      </div>
    </aside>
  );
}
