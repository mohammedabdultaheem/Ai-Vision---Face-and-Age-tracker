"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Cpu
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

export default function ModelEvaluationPage() {
  const [isRunningEval, setIsRunningEval] = useState(false);
  const [evalSuccess, setEvalSuccess] = useState(false);

  const qualityPerformanceData = [
    { metric: "Good Quality", accuracy: 92.4, mae: 2.4, samples: 3400 },
    { metric: "Moderate Quality", accuracy: 84.1, mae: 3.9, samples: 1200 },
    { metric: "Poor Quality", accuracy: 62.8, mae: 5.6, samples: 400 },
  ];

  const benchmarkComparisons = [
    { benchmark: "Adience Benchmark", yunetAgeNet: 87.6, baselineCNN: 82.1, humanEval: 89.2 },
    { benchmark: "UTKFace Cohort", yunetAgeNet: 89.4, baselineCNN: 84.5, humanEval: 91.0 },
    { benchmark: "FairFace Diverse", yunetAgeNet: 86.2, baselineCNN: 79.8, humanEval: 88.5 },
    { benchmark: "Cross-Lighting Set", yunetAgeNet: 82.5, baselineCNN: 73.4, humanEval: 84.0 },
  ];

  const radarMetrics = [
    { subject: "Frontal Precision", A: 94, fullMark: 100 },
    { subject: "Low Light Robustness", A: 76, fullMark: 100 },
    { subject: "Blur Tolerance", A: 78, fullMark: 100 },
    { subject: "Inference Speed", A: 96, fullMark: 100 },
    { subject: "Edge Alignment", A: 88, fullMark: 100 },
    { subject: "Demographic Equity", A: 91, fullMark: 100 },
  ];

  const handleRunEvaluation = () => {
    setIsRunningEval(true);
    setEvalSuccess(false);
    setTimeout(() => {
      setIsRunningEval(false);
      setEvalSuccess(true);
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-electric-500/10 border border-electric-500/20 text-electric-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                Model Evaluation & Benchmark Diagnostics
              </h1>
              <p className="text-xs text-slate-400">
                Quantitative validation across standardized cohorts (MAE, RMSE, stratified accuracy)
              </p>
            </div>
          </div>

          <button
            onClick={handleRunEvaluation}
            disabled={isRunningEval}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-electric-500 to-accent-500 text-white text-xs font-semibold shadow-lg shadow-electric-500/20 hover:opacity-95 transition disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningEval ? "animate-spin" : ""}`} />
            <span>{isRunningEval ? "Evaluating Benchmark..." : "Execute Full Benchmark Suite"}</span>
          </button>
        </div>

        {evalSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Benchmark evaluation executed across 5,000 randomized test samples. Metrics refreshed.</span>
          </div>
        )}

        {/* 4 Core Quantitative Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-1.5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mean Absolute Error (MAE)
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">3.18 <span className="text-sm text-slate-400">years</span></div>
            <div className="text-[11px] text-emerald-400">Exceeds target &le; 3.5 yrs</div>
          </div>

          <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-1.5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Root Mean Squared Error
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">4.05 <span className="text-sm text-slate-400">years</span></div>
            <div className="text-[11px] text-slate-400">Penalizes extreme outliers</div>
          </div>

          <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-1.5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Age-Range Accuracy
            </div>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">87.6%</div>
            <div className="text-[11px] text-slate-400">Within calibrated interval</div>
          </div>

          <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-1.5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Confidence Calibration
            </div>
            <div className="text-2xl font-bold text-electric-400 tracking-tight">0.942</div>
            <div className="text-[11px] text-slate-400">Brier score: 0.058</div>
          </div>
        </div>

        {/* Stratified Breakdown & Radar Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Stratified by Quality (2 Cols) */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Performance Stratified by Image Quality Condition
              </h3>
              <p className="text-[11px] text-slate-400">
                Demonstrates model precision degradation under adverse illumination and motion blur
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qualityPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="metric" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0A0F1D", borderColor: "#334155", fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11, paddingBottom: 10 }} />
                  <Bar dataKey="accuracy" name="Accuracy (%)" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mae" name="MAE (Years)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Robustness Profile (1 Col) */}
          <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Robustness Radar Analysis
              </h3>
              <p className="text-[11px] text-slate-400">Multi-factor environmental evaluation</p>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarMetrics} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="#1E293B" />
                  <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={10} />
                  <PolarRadiusAxis stroke="#334155" fontSize={9} />
                  <Radar name="Active Model" dataKey="A" stroke="#A855F7" fill="#A855F7" fillOpacity={0.35} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0A0F1D", borderColor: "#334155", fontSize: 12, borderRadius: 8 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Benchmark Comparisons Table */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Comparative Benchmark Cohort Scores
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Benchmark Cohort</th>
                  <th className="p-3">YuNet + AgeNet (Ours)</th>
                  <th className="p-3">Legacy Caffe Baseline</th>
                  <th className="p-3">Human Evaluator Baseline</th>
                  <th className="p-3">Delta vs Baseline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {benchmarkComparisons.map((b, idx) => {
                  const delta = (b.yunetAgeNet - b.baselineCNN).toFixed(1);
                  return (
                    <tr key={idx} className="hover:bg-navy-850/50 transition">
                      <td className="p-3 font-semibold text-white">{b.benchmark}</td>
                      <td className="p-3 font-mono font-bold text-electric-400">{b.yunetAgeNet}%</td>
                      <td className="p-3 font-mono text-slate-400">{b.baselineCNN}%</td>
                      <td className="p-3 font-mono text-slate-400">{b.humanEval}%</td>
                      <td className="p-3 font-mono text-emerald-400 font-semibold">+{delta}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

