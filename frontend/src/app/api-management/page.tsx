"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Key,
  Plus,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Code,
  Terminal,
  Zap
} from "lucide-react";
import { api } from "@/lib/api";

export default function ApiManagementPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getApiKeys();
        setApiKeys(data);
      } catch (e) {
        console.warn(e);
      }
    }
    load();
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-electric-500/10 border border-electric-500/20 text-electric-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                API Management & Ingestion Gateway
              </h1>
              <p className="text-xs text-slate-400">
                Manage high-throughput REST and WebSocket programmatic keys with rate-limiting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-navy-850 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Interactive Swagger UI</span>
            </a>
          </div>
        </div>

        {/* API Keys Table */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Active Enterprise API Ingestion Keys
            </h3>
          </div>

          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="p-4 rounded-xl bg-navy-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-white flex items-center gap-2">
                    {key.name}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </div>
                  <div className="font-mono text-slate-400 text-[11px] flex items-center gap-2">
                    <span>Prefix: {key.prefix}</span>
                    <span>• Rate Limit: {key.rate_limit_rpm} RPM</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(key.id, `aiv_live_${key.id}_secret_token_2026`)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-slate-800 border border-slate-700 text-slate-200 transition"
                >
                  {copiedKey === key.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied Key</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Key</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Code Snippet Example */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-electric-400" />
            cURL Face Analysis Integration Snippet
          </h3>
          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            {`curl -X POST "http://localhost:8000/api/v1/detection/analyze" \\
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \\
  -F "file=@sample_photo.jpg"`}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

