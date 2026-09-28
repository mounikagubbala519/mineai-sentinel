import React, { useState } from 'react';
import { Activity, ShieldAlert, RefreshCw, Database, Volume2, VolumeX, BellRing } from 'lucide-react';
import { alarmSystem } from '../utils/audioAlarm';

export default function Navbar({ onRefresh, isRefreshing, isHighRisk, onTriggerTestAlarm, activeAlertCount = 0, onOpenAlerts }) {
  const [isMuted, setIsMuted] = useState(false);

  const handleToggleMute = () => {
    const muted = alarmSystem.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50 px-6 py-3 flex flex-col md:flex-row items-center justify-between shadow-lg gap-3">
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-md shadow-cyan-500/20">
          <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white font-mono">
              MineAI <span className="text-cyan-400">Sentinel</span>
            </h1>
            <span className="bg-cyan-500/10 text-cyan-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-cyan-500/30">
              MOIL Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-400">
            AI-Powered Manganese Reserve Intelligence & Production Risk Platform
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center space-x-3">
        {/* NOTIFICATION BELL WITH ACTIVE ALERT BADGE */}
        <button
          onClick={onOpenAlerts}
          title="Open Alert & Early Warning Center"
          className="relative p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition flex items-center justify-center"
        >
          <BellRing className="h-5 w-5 text-amber-400" />
          {activeAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono font-bold text-[10px] h-5 min-w-5 px-1 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md">
              {activeAlertCount}
            </span>
          )}
        </button>

        {/* HIGH RISK AUDIBLE ALARM INDICATOR */}
        {isHighRisk && (
          <div className="flex items-center space-x-2 bg-rose-500/20 border border-rose-500/50 text-rose-400 text-xs px-3 py-1.5 rounded-lg animate-pulse shadow-lg shadow-rose-500/20">
            <BellRing className="h-4 w-4 text-rose-400 animate-bounce" />
            <span className="font-bold tracking-wide">HIGH RISK ALARM DETECTED</span>
          </div>
        )}

        {/* ALARM MUTE / TEST BUTTON */}
        <button
          onClick={handleToggleMute}
          title={isMuted ? "Unmute Risk Alarm Sound" : "Mute Risk Alarm Sound"}
          className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
            isMuted
              ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
          }`}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 animate-pulse" />}
          <span>{isMuted ? 'Alarm Muted' : 'Alarm Sound Active'}</span>
        </button>

        <button
          onClick={onTriggerTestAlarm}
          className="flex items-center space-x-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition"
        >
          <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
          <span>Test Alarm</span>
        </button>

        {/* DEMO MODE BADGE */}
        <div className="hidden lg:flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-3 py-1.5 rounded-lg shadow-inner">
          <Database className="h-4 w-4 text-amber-400" />
          <span className="font-medium tracking-wide">Demo Mode</span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition duration-150 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
}
