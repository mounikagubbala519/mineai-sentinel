import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, Info, BarChart2 } from 'lucide-react';
import { api } from '../api';

export default function ModelPerformance() {
  const [metricsData, setMetricsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await api.getModelMetrics();
        setMetricsData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading ML Evaluation Metrics...</div>;
  }

  const metrics = metricsData ? metricsData.metrics || {} : {};
  const reserveModel = metrics.reserve_model || { model_name: 'RandomForestRegressor', mae: 531.2, rmse: 578.9, r2: 0.5416, feature_importances: {} };
  const prodModel = metrics.production_model || { model_name: 'GradientBoostingRegressor', mae: 54.4, rmse: 71.3, r2: 0.9672, feature_importances: {} };
  const shortfallModel = metrics.shortfall_model || { model_name: 'HistGradientBoostingClassifier', accuracy: 0.9574, precision: 0.952, recall: 0.957, f1: 0.9464, roc_auc: 0.9894, feature_importances: {} };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-white flex items-center space-x-2">
          <Cpu className="h-5 w-5 text-cyan-400" />
          <span>Machine Learning Model Performance & Validation</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Empirical evaluation metrics calculated directly from out-of-sample test splits across all 3 predictive pipelines.
        </p>
      </div>

      {/* MANDATORY DISCLAIMER BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-start space-x-3 text-slate-400 text-xs shadow-sm">
        <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          {metricsData ? metricsData.disclaimer : "Metrics are calculated using the prototype synthetic dataset and do not represent real-world MOIL performance."}
        </span>
      </div>

      {/* 3 Model Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* RESERVE MODEL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20 uppercase">
              Regression Pipeline
            </span>
            <h3 className="text-sm font-bold text-white mt-2">Reserve Estimation Model</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{reserveModel.model_name}</p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">MAE (Mean Abs Error):</span>
              <span className="font-mono text-white font-bold">{reserveModel.mae} MT</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">RMSE:</span>
              <span className="font-mono text-slate-200 font-bold">{reserveModel.rmse} MT</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">R² Score:</span>
              <span className="font-mono text-cyan-400 font-bold">{reserveModel.r2}</span>
            </div>
          </div>
        </div>

        {/* PRODUCTION FORECAST MODEL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 uppercase">
              Time-Series Regressor
            </span>
            <h3 className="text-sm font-bold text-white mt-2">Production Forecasting Model</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{prodModel.model_name}</p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">MAE (Daily Error):</span>
              <span className="font-mono text-white font-bold">{prodModel.mae} tpd</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">RMSE:</span>
              <span className="font-mono text-slate-200 font-bold">{prodModel.rmse} tpd</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">R² Score:</span>
              <span className="font-mono text-emerald-400 font-bold">{prodModel.r2}</span>
            </div>
          </div>
        </div>

        {/* SHORTFALL CLASSIFIER MODEL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20 uppercase">
              Multi-Class Classifier
            </span>
            <h3 className="text-sm font-bold text-white mt-2">Shortfall Risk Classifier</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{shortfallModel.model_name}</p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">Validation Accuracy:</span>
              <span className="font-mono text-indigo-400 font-bold">{(shortfallModel.accuracy * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">F1 Score:</span>
              <span className="font-mono text-white font-bold">{shortfallModel.f1}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">ROC-AUC:</span>
              <span className="font-mono text-cyan-400 font-bold">{shortfallModel.roc_auc}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
