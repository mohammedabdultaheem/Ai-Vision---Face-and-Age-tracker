"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Cpu,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  UploadCloud,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
  Info
} from "lucide-react";
import { api } from "@/lib/api";
import { ModelRegistryItem } from "@/lib/types";

export default function ModelsPage() {
  const [models, setModels] = useState<ModelRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Form State
  const [newModelName, setNewModelName] = useState("");
  const [newArchitecture, setNewArchitecture] = useState("Custom ResNet-50 ONNX");
  const [newVersion, setNewVersion] = useState("v2.1.0");
  const [newProvenance, setNewProvenance] = useState("FairFace Validated Subset");
  const [newLicense, setNewLicense] = useState("Apache-2.0");

  const loadModels = async () => {
    setLoading(true);
    try {
      const data = await api.getModels();
      setModels(data);
    } catch (e) {
      console.warn("Could not fetch models:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleDeploy = async (modelId: number, env: string) => {
    try {
      const res = await api.deployModel(modelId, env);
      setActionMsg(res.message);
      loadModels();
    } catch (err: any) {
      alert("Deployment failed: " + err.message);
    }
  };

  const handleRollback = async () => {
    if (!confirm("Revert active production model to previous verified checkpoint?")) return;
    try {
      const res = await api.rollbackModel("age_estimation");
      setActionMsg(res.message);
      loadModels();
    } catch (err: any) {
      alert("Rollback failed: " + err.message);
    }
  };

  const handleValidate = async (modelId: number) => {
    try {
      const res = await api.validateModel(modelId);
      setValidationResult(res);
      setShowValidationModal(true);
    } catch (err: any) {
      alert("Validation failed: " + err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.registerModel({
        model_name: newModelName,
        model_type: "age_estimation",
        architecture: newArchitecture,
        version: newVersion,
        dataset_provenance: newProvenance,
        license: newLicense,
      });
      setShowRegisterModal(false);
      setActionMsg(`Successfully registered ${newModelName} ${newVersion}`);
      loadModels();
    } catch (err: any) {
      alert("Registration failed: " + err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                AI Model Management & Deployment Registry
              </h1>
              <p className="text-xs text-slate-400">
                Governance, versioning, staging promotions, and 1-click rollback controls
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRollback}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-navy-850 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-400 transition"
              title="Rollback production deployment"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rollback Deployment</span>
            </button>

            <button
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-electric-500 to-accent-500 text-white text-xs font-semibold shadow-lg shadow-electric-500/20 hover:opacity-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Model</span>
            </button>
          </div>
        </div>

        {actionMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{actionMsg}</span>
            </div>
            <button onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {models.map((m) => {
            const isActive = m.status === "active";
            const isStaging = m.status === "staging";

            return (
              <div
                key={m.id}
                className={`p-5 rounded-2xl bg-navy-900/90 border space-y-4 flex flex-col justify-between transition-all duration-300 ${
                  isActive
                    ? "border-electric-500/50 shadow-xl shadow-electric-500/10"
                    : isStaging
                    ? "border-amber-500/40"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {m.version}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        isActive
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : isStaging
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {isActive ? "PRODUCTION" : isStaging ? "STAGING" : "INACTIVE"}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white truncate">{m.model_name}</h3>
                  <div className="text-xs font-mono text-electric-400">{m.architecture}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                    {m.description || "Model trained for facial localization and morphological feature extraction."}
                  </p>
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-navy-950 border border-slate-800/80 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400">MAE</div>
                    <div className="text-xs font-bold text-white mt-0.5">{m.mae || 3.18} yrs</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Accuracy</div>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">{m.range_accuracy}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Latency</div>
                    <div className="text-xs font-bold text-accent-400 mt-0.5">{m.latency_ms} ms</div>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="space-y-1 text-[11px] text-slate-400 border-t border-slate-800/70 pt-3">
                  <div className="flex justify-between">
                    <span>Provenance:</span>
                    <span className="text-slate-200 truncate max-w-[160px]">{m.dataset_provenance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>License:</span>
                    <span className="text-slate-200">{m.license}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model Size:</span>
                    <span className="text-slate-200 font-mono">{m.model_size}</span>
                  </div>
                </div>

                {/* Administrative Operation Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleValidate(m.id)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-navy-850 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition"
                  >
                    Validate
                  </button>

                  {!isActive && (
                    <button
                      onClick={() => handleDeploy(m.id, "production")}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-electric-500 hover:bg-electric-400 text-white text-xs font-semibold shadow transition"
                    >
                      Promote to Prod
                    </button>
                  )}

                  {isActive && (
                    <div className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-xs font-semibold text-center flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3" /> Live Serving
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Validation Modal */}
        {showValidationModal && validationResult && (
          <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-navy-900 border border-slate-700 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Model Validation Report</h3>
                </div>
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 space-y-1">
                  <div className="text-slate-400">Target Model:</div>
                  <div className="font-bold text-white text-sm">{validationResult.model_name}</div>
                </div>

                <div className="space-y-2">
                  {validationResult.checks.map((c: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-navy-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{c.check}</div>
                        <div className="text-[11px] text-slate-400">{c.details}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                        {c.passed ? "PASSED" : "FAILED"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowValidationModal(false)}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Close Report
              </button>
            </div>
          </div>
        )}

        {/* Register Model Modal */}
        {showRegisterModal && (
          <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-navy-900 border border-slate-700 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Register Pretrained Model</h3>
                <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    placeholder="e.g. ResNet-50 Age Estimation Checkpoint"
                    className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Architecture</label>
                    <input
                      type="text"
                      required
                      value={newArchitecture}
                      onChange={(e) => setNewArchitecture(e.target.value)}
                      className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Version Tag</label>
                    <input
                      type="text"
                      required
                      value={newVersion}
                      onChange={(e) => setNewVersion(e.target.value)}
                      className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Dataset Provenance</label>
                  <input
                    type="text"
                    required
                    value={newProvenance}
                    onChange={(e) => setNewProvenance(e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">License</label>
                  <input
                    type="text"
                    required
                    value={newLicense}
                    onChange={(e) => setNewLicense(e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2 rounded-lg bg-navy-850 text-slate-300 hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-electric-500 hover:bg-electric-400 text-white font-semibold transition"
                  >
                    Register Model
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

