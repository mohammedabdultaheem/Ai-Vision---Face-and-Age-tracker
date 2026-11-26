"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Database,
  Plus,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  FolderOpen
} from "lucide-react";
import { api } from "@/lib/api";
import { DatasetItem } from "@/lib/types";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sampleCount, setSampleCount] = useState<number>(15000);
  const [license, setLicense] = useState("Academic Non-Commercial (CC BY-NC 4.0)");
  const [consentVerified, setConsentVerified] = useState(true);

  const loadDatasets = async () => {
    try {
      const data = await api.getDatasets();
      setDatasets(data);
    } catch (e) {
      console.warn("Could not load datasets:", e);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDataset({
        name,
        description,
        sample_count: sampleCount,
        license,
        consent_verified: consentVerified,
      });
      setShowModal(false);
      setName("");
      setDescription("");
      loadDatasets();
    } catch (err: any) {
      alert("Registration failed: " + err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-electric-500/10 border border-electric-500/20 text-electric-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                Authorized Training Datasets & Provenance
              </h1>
              <p className="text-xs text-slate-400">
                Registered benchmark corpora with verified subject consent and commercial license auditing
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-electric-500 to-accent-500 text-white text-xs font-semibold shadow-lg shadow-electric-500/20 hover:opacity-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Authorized Dataset</span>
          </button>
        </div>

        {/* Datasets Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {datasets.map((ds) => (
            <div
              key={ds.id}
              className="p-5 rounded-2xl bg-navy-900/90 border border-slate-800 space-y-4 flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-electric-400">
                    DS-{ds.id.toString().padStart(3, "0")}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {ds.label_status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white truncate">{ds.name}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                  {ds.description || "Authorized facial morphological research cohort."}
                </p>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-navy-950 border border-slate-800/80 text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Samples:</span>
                  <span className="font-mono font-semibold text-white">{ds.sample_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">File Size:</span>
                  <span className="font-mono text-white">{ds.file_size_mb} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">License:</span>
                  <span className="text-slate-200 truncate max-w-[140px]">{ds.license}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Consent Verified:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Certified
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-navy-900 border border-slate-700 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Register Dataset Corpus</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Dataset Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. FairFace Balanced Benchmark Cohort"
                    className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe source annotation methodology and demographic coverage..."
                    className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Sample Count</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={sampleCount}
                      onChange={(e) => setSampleCount(Number(e.target.value))}
                      className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">License</label>
                    <input
                      type="text"
                      required
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                      className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consentVerified}
                    onChange={(e) => setConsentVerified(e.target.checked)}
                    className="rounded border-slate-700 text-electric-500 focus:ring-0"
                  />
                  <label htmlFor="consent" className="text-slate-300 text-[11px]">
                    I declare and certify that all included subject records have documented consent and authorization.
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg bg-navy-850 text-slate-300 hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!consentVerified}
                    className="px-4 py-2 rounded-lg bg-electric-500 hover:bg-electric-400 text-white font-semibold transition disabled:opacity-40"
                  >
                    Register Dataset
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

