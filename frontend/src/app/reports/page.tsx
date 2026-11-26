"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  FileText,
  Download,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Table,
  Layers,
  ArrowDownToLine
} from "lucide-react";
import { api } from "@/lib/api";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getReports();
        setReports(data);
      } catch (e) {
        console.warn(e);
      }
    }
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-electric-500/10 border border-electric-500/20 text-electric-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                Executive Reports & Compliance Exports
              </h1>
              <p className="text-xs text-slate-400">
                Download aggregate statistical summaries and audit telemetry with zero biometric exposure
              </p>
            </div>
          </div>

          <a
            href={api.getExportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-electric-500 to-accent-500 text-white text-xs font-semibold shadow-lg shadow-electric-500/20 hover:opacity-95 transition"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Download Aggregate CSV Report</span>
          </a>
        </div>

        {/* Reports Table */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Recent Aggregated Analysis Reports
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Generated Sessions: {reports.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Report ID</th>
                  <th className="p-3">Ingestion Mode</th>
                  <th className="p-3">Detected Faces</th>
                  <th className="p-3">Avg Latency</th>
                  <th className="p-3">Quality Profile</th>
                  <th className="p-3">Generation Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-500">
                      No session reports archived yet. Perform live detection or image upload to populate.
                    </td>
                  </tr>
                ) : (
                  reports.map((r, idx) => (
                    <tr key={idx} className="hover:bg-navy-850/50 transition">
                      <td className="p-3 font-mono font-bold text-electric-400">{r.report_id}</td>
                      <td className="p-3 font-semibold text-white capitalize">{r.mode.replace("_", " ")}</td>
                      <td className="p-3 font-mono">{r.total_faces}</td>
                      <td className="p-3 font-mono">{r.avg_latency_ms} ms</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                          {r.quality_summary}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-mono">
                        {r.created_at ? new Date(r.created_at).toLocaleString() : "Recent"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

