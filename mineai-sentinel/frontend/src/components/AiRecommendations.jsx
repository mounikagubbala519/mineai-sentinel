import React from 'react';
import { Lightbulb, ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function AiRecommendations({ recommendationsData }) {
  const disclaimer = recommendationsData ? recommendationsData.disclaimer : (
    "Prototype decision-support recommendations. Final operational decisions must be made by qualified mining and safety professionals."
  );

  const recommendations = recommendationsData ? recommendationsData.active_recommendations || [] : [
    {
      id: "REC-001",
      title: "Equipment Fleet Re-allocation",
      priority: "HIGH",
      affected_factor: "Equipment Downtime",
      suggested_action: "Re-deploy 2 available CAT haulers from low-priority reserve block (BLK-B04) to high-yield Balaghat Central vein to compensate for breakdown loss.",
      expected_objective: "+180 Tonnes/day production recovery",
      risk_category: "EQUIPMENT"
    },
    {
      id: "REC-002",
      title: "Pit Operations & Haul-Road Weather Protocol",
      priority: "HIGH",
      affected_factor: "Weather / Rainfall",
      suggested_action: "Heavy rainfall detected. Temporarily halt deep-pit haulage on slippery incline roads; divert heavy excavators to upper well-drained benches.",
      expected_objective: "Prevent pit haulage accidents & maintain 75% baseline throughput",
      risk_category: "WEATHER"
    },
    {
      id: "REC-003",
      title: "Blasting Clearance & Window Optimization",
      priority: "MEDIUM",
      affected_factor: "Blasting Clearance",
      suggested_action: "Blasting delay is currently above baseline. Coordinate immediate explosive clearance with safety officers for the upcoming shift window.",
      expected_objective: "Eliminate 90 minutes of downstream mucking delays",
      risk_category: "BLASTING"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-white flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-cyan-400" />
          <span>AI Decision-Support Recommendation Hub</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Rule-driven and ML risk-weighted corrective action generator for mine planning and shortfall mitigation.
        </p>
      </div>

      {/* MANDATORY DISCLAIMER BANNER */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-start space-x-3 text-amber-300 text-xs shadow-sm">
        <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">{disclaimer}</span>
      </div>

      {/* Actionable Recommendations List */}
      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 transition duration-150 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20">
                  {rec.id}
                </span>
                <h3 className="text-sm font-bold text-white">{rec.title}</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                rec.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                rec.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {rec.priority} PRIORITY
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Affected Risk Factor:</span>
                <span className="text-slate-200 font-semibold ml-2">{rec.affected_factor}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Suggested Action:</span>
                <p className="text-slate-200 mt-1 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  {rec.suggested_action}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-slate-300">
                <span>Expected Operational Objective:</span>
                <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                  {rec.expected_objective}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
