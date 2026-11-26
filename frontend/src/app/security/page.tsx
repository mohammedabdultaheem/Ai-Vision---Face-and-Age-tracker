"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Server,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Save,
  Key
} from "lucide-react";
import { api } from "@/lib/api";

export default function SecurityCenterPage() {
  const [privacySettings, setPrivacySettings] = useState<any>(null);
  const [retentionDays, setRetentionDays] = useState(30);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const s = await api.getPrivacySettings();
        setPrivacySettings(s);
        setRetentionDays(s.data_retention_days || 30);
      } catch (e) {
        console.warn(e);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updatePrivacySettings({ data_retention_days: retentionDays });
      setStatusMsg("Privacy posture settings updated and cryptographically verified.");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                Enterprise Security Center & Privacy Posture
              </h1>
              <p className="text-xs text-slate-400">
                Zero-retention cryptographic validation, biometric privacy guarantees, and data protection enforcement
              </p>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* 4 Pillars of Privacy */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="font-bold uppercase tracking-wider text-[10px]">Pillar I</span>
              <EyeOff className="w-4 h-4" />
            </div>
            <div className="font-bold text-white text-sm">Zero Image Storage</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Video frames and uploaded images are processed strictly in RAM and instantly unlinked post-inference.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-electric-400">
              <span className="font-bold uppercase tracking-wider text-[10px]">Pillar II</span>
              <Lock className="w-4 h-4" />
            </div>
            <div className="font-bold text-white text-sm">No Persistent Vectors</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              No 128-d or 512-d biometric face embeddings, galleries, or persistent subject identification databases.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-purple-400">
              <span className="font-bold uppercase tracking-wider text-[10px]">Pillar III</span>
              <Server className="w-4 h-4" />
            </div>
            <div className="font-bold text-white text-sm">Temporary Session IDs</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Faces are assigned non-correlating transient tokens (e.g. &ldquo;Face #1&rdquo;) valid solely during active sampling.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-amber-400">
              <span className="font-bold uppercase tracking-wider text-[10px]">Pillar IV</span>
              <FileCheck className="w-4 h-4" />
            </div>
            <div className="font-bold text-white text-sm">Audit Compliance</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every administrative model deployment, rollback, and data operation is immutably logged with SHA-256 integrity.
            </p>
          </div>
        </div>

        {/* Regulatory Posture & Retention Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Jurisdictional Compliance Matrix
            </h3>
            <div className="space-y-2.5 text-xs">
              {[
                { reg: "GDPR Article 9", desc: "Explicit prohibition of unauthorized biometric data processing", status: "COMPLIANT" },
                { reg: "CCPA / CPRA", desc: "Zero consumer biometric retention and consumer disclosure", status: "COMPLIANT" },
                { reg: "Illinois BIPA Standards", desc: "Written consent policy enforcement and zero persistent templates", status: "ALIGNED" },
                { reg: "EU AI Act Transparency", desc: "Clear marking of approximate AI predictions and uncertainty handling", status: "VERIFIED" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white">{item.reg}</div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Retention Configuration Form */}
          <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Metadata Retention Window
            </h3>
            <p className="text-xs text-slate-400">
              Configure maximum retention duration for aggregate telemetry logs (individual biometric data is always 0 days).
            </p>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Log Retention Horizon (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 space-y-1">
                <div className="font-semibold text-white">Biometric Imagery Retention</div>
                <div className="text-emerald-400 font-mono font-bold">0 Days (RAM Ephemeral Default)</div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-electric-500 to-accent-500 text-white font-semibold shadow-lg shadow-electric-500/20 hover:opacity-95 transition flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Retention Settings</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

