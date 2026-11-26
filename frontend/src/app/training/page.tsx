"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Layers,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  Activity,
  Plus,
  RefreshCw,
  Cpu,
  Database
} from "lucide-react";
import { api } from "@/lib/api";
import { TrainingJobItem, DatasetItem } from "@/lib/types";

export default function TrainingPage() {
  const [jobs, setJobs] = useState<TrainingJobItem[]>([]);
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedJob, setSelectedJob] = useState<TrainingJobItem | null>(null);
  const [jobLogs, setJobLogs] = useState<string>("");
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [jobName, setJobName] = useState("AgeNet Inception Fine-Tuning Run");
  const [datasetId, setDatasetId] = useState<number>(1);
  const [epochs, setEpochs] = useState<number>(5);
  const [batchSize, setBatchSize] = useState<number>(32);
  const [lr, setLr] = useState<number>(0.001);
  const [valSplit, setValSplit] = useState<number>(0.2);

  const loadData = async () => {
    try {
      const [allJobs, allDatasets] = await Promise.all([
        api.getTrainingJobs(),
        api.getDatasets(),
      ]);
      setJobs(allJobs);
      setDatasets(allDatasets);
      if (allJobs.length > 0 && !selectedJob) {
        setSelectedJob(allJobs[0]);
        loadLogs(allJobs[0].id);
      }
    } catch (e) {
      console.warn("Could not fetch training jobs:", e);
    }
  };

  const loadLogs = async (jobId: number) => {
    try {
      const res = await api.getTrainingLogs(jobId);
      setJobLogs(res.logs);
    } catch (e) {
      console.warn("Could not fetch logs:", e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (selectedJob && (selectedJob.status === "training" || selectedJob.status === "validating")) {
        loadData();
        loadLogs(selectedJob.id);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedJob]);

  const handleStartTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newJob = await api.startTrainingJob({
        job_name: jobName,
        dataset_id: datasetId,
        epochs,
        batch_size: batchSize,
        learning_rate: lr,
        validation_split: valSplit,
      });
      setShowModal(false);
      setSelectedJob(newJob);
      loadData();
    } catch (err: any) {
      alert("Failed to queue training job: " + err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                Model Fine-Tuning & Training Engine
              </h1>
              <p className="text-xs text-slate-400">
                PyTorch/ONNX hyperparameter optimization, real epoch convergence, and validation logging
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-electric-500 to-accent-500 text-white text-xs font-semibold shadow-lg shadow-electric-500/20 hover:opacity-95 transition"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Configure & Start Training Run</span>
          </button>
        </div>

        {/* Training Jobs & Console Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Jobs List (1 Col) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider px-1">
              <span>Active & Historical Jobs</span>
              <button onClick={loadData} className="text-slate-400 hover:text-white transition">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {jobs.length === 0 ? (
                <div className="p-6 rounded-xl bg-navy-900 border border-slate-800 text-center text-xs text-slate-500">
                  No training runs initiated yet.
                </div>
              ) : (
                jobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  const isRunning = job.status === "training" || job.status === "validating";

                  return (
                    <div
                      key={job.id}
                      onClick={() => {
                        setSelectedJob(job);
                        loadLogs(job.id);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition space-y-2 ${
                        isSelected
                          ? "bg-navy-850 border-electric-500/60 shadow-lg shadow-electric-500/10"
                          : "bg-navy-900/80 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">JOB #{job.id}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                            job.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : isRunning
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                          {job.status.toUpperCase()}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white truncate">{job.job_name}</h4>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                        <div>
                          Epoch: <span className="text-slate-200">{job.current_epoch}/{job.epochs}</span>
                        </div>
                        <div>
                          Val Acc: <span className="text-emerald-400 font-semibold">{job.current_val_acc}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Job Details & Terminal Output (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            {selectedJob ? (
              <div className="p-5 rounded-2xl bg-navy-900/90 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedJob.job_name}</h3>
                    <div className="text-xs text-slate-400 mt-0.5 font-mono">
                      Base Model: {selectedJob.base_model} • Batch: {selectedJob.batch_size} • LR: {selectedJob.learning_rate}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Status</div>
                    <div className="text-xs font-bold font-mono text-electric-400">
                      {selectedJob.status.toUpperCase()} (Epoch {selectedJob.current_epoch}/{selectedJob.epochs})
                    </div>
                  </div>
                </div>

                {/* Progress Metric Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Training Cycle Completion</span>
                    <span className="font-mono font-bold text-electric-400">
                      {Math.round((selectedJob.current_epoch / selectedJob.epochs) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-electric-500 to-accent-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round((selectedJob.current_epoch / selectedJob.epochs) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Current Loss</div>
                    <div className="text-base font-bold font-mono text-white mt-1">
                      {selectedJob.current_loss || "0.0000"}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Validation Accuracy</div>
                    <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                      {selectedJob.current_val_acc || "0.00"}%
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Validation Split</div>
                    <div className="text-base font-bold font-mono text-purple-400 mt-1">
                      {selectedJob.validation_split * 100}%
                    </div>
                  </div>
                </div>

                {/* Console Log Terminal */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-electric-400" /> Live Epoch Training Stream
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">stdout/stderr</span>
                  </div>
                  <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 font-mono text-xs text-slate-300 h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {jobLogs || "Awaiting training initialization...\n"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-navy-900 border border-slate-800 text-center text-xs text-slate-500">
                Select a training job to inspect live convergence graphs and telemetry.
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-navy-900 border border-slate-700 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Configure Fine-Tuning Execution</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleStartTraining} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Job Designation</label>
                  <input
                    type="text"
                    required
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Training Corpus</label>
                  <select
                    value={datasetId}
                    onChange={(e) => setDatasetId(Number(e.target.value))}
                    className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                  >
                    {datasets.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.sample_count.toLocaleString()} samples)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Epochs</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={epochs}
                      onChange={(e) => setEpochs(Number(e.target.value))}
                      className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Batch Size</label>
                    <input
                      type="number"
                      min={8}
                      max={128}
                      value={batchSize}
                      onChange={(e) => setBatchSize(Number(e.target.value))}
                      className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Learning Rate</label>
                    <input
                      type="number"
                      step={0.0001}
                      min={0.0001}
                      value={lr}
                      onChange={(e) => setLr(Number(e.target.value))}
                      className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Validation Split</label>
                    <input
                      type="number"
                      step={0.05}
                      min={0.1}
                      max={0.4}
                      value={valSplit}
                      onChange={(e) => setValSplit(Number(e.target.value))}
                      className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                    />
                  </div>
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
                    className="px-4 py-2 rounded-lg bg-electric-500 hover:bg-electric-400 text-white font-semibold transition"
                  >
                    Launch Training Job
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

