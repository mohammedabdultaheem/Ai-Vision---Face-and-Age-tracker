"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  TrendingUp,
  Activity,
  BarChart2,
  PieChart as PieIcon,
  ShieldCheck,
  Calendar,
  Layers
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { api } from "@/lib/api";

export default function AnalyticsPage() {
  const [latencyData, setLatencyData] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const perf = await api.getPerformance(7);
        setLatencyData(perf.latency_history);
      } catch (e) {
        console.warn(e);
      }
    }
    load();
  }, []);

  const percentileData = [
    { hour: "00:00", p50: 14.1, p90: 17.5, p99: 22.1 },
    { hour: "04:00", p50: 13.8, p90: 16.9, p99: 20.4 },
    { hour: "08:00", p50: 15.2, p90: 18.7, p99: 24.3 },
    { hour: "12:00", p50: 16.8, p90: 20.2, p99: 26.5 },
    { hour: "16:00", p50: 16.2, p90: 19.4, p99: 25.1 },
    { hour: "20:00", p50: 14.9, p90: 18.0, p99: 23.0 },
  ];

  const errorDistribution = [
    { category: "Low Lighting (<45)", count: 28 },
    { category: "Motion Blur (>75)", count: 42 },
    { category: "Frame Truncation", count: 19 },
    { category: "Extreme Face Overlap", count: 11 },
    { category: "Resolution (<50px)", count: 35 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-electric-500/10 border border-electric-500/20 text-electric-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                Operational Analytics & Latency Telemetry
              </h1>
              <p className="text-xs text-slate-400">
                P50/P90/P99 latency profiles, quality degradation vectors, and hardware utilization
              </p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latency Percentiles */}
          <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Inference Latency Percentiles (P50, P90, P99)
              </h3>
              <p className="text-[11px] text-slate-400">CPU pipeline execution measured in milliseconds</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={percentileData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="hour" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="ms" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0A0F1D", borderColor: "#334155", fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11, paddingBottom: 10 }} />
                  <Line type="monotone" dataKey="p50" name="P50 Latency" stroke="#10B981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p90" name="P90 Latency" stroke="#38BDF8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p99" name="P99 Latency" stroke="#F59E0B" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quality Vector Degradation Bar Chart */}
          <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Environmental Quality Warnings Breakdown
              </h3>
              <p className="text-[11px] text-slate-400">Trigger counts for automated quality advisories</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorDistribution} layout="vertical" margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="category" stroke="#94A3B8" fontSize={10} tickLine={false} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0A0F1D", borderColor: "#334155", fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

