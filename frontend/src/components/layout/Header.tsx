"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import {
  Activity,
  ShieldCheck,
  Cpu,
  Sparkles,
  Camera,
  Bell,
  HelpCircle
} from "lucide-react";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, role } = useAuth();

  const getPageTitle = (path: string) => {
    const segment = path.replace("/", "");
    if (!segment || segment === "dashboard") return "Platform Overview";
    return segment
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <header className="h-16 px-6 border-b border-slate-800/80 bg-navy-950/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center space-x-3">
        <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          {getPageTitle(pathname)}
        </h1>
        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
          v1.0.0
        </span>
      </div>

      {/* System Status Indicators */}
      <div className="flex items-center space-x-3">
        {/* Model Engine Status */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-navy-900 border border-slate-800 text-xs">
          <Cpu className="w-3.5 h-3.5 text-electric-400 animate-pulse" />
          <span className="text-slate-400">Model:</span>
          <span className="font-semibold text-slate-200">YuNet + Age-GoogleNet</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
        </div>

        {/* Inference Latency */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-navy-900 border border-slate-800 text-xs">
          <Activity className="w-3.5 h-3.5 text-accent-400" />
          <span className="text-slate-400">Latency:</span>
          <span className="font-mono font-medium text-slate-200">~16ms P95</span>
        </div>

        {/* Zero-Retention Privacy Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">RAM Ephemeral</span>
        </div>

        {/* Quick Live Camera CTA */}
        {pathname !== "/live-detection" && (
          <Link
            href="/live-detection"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-electric-500 to-accent-500 text-white text-xs font-semibold shadow-md shadow-electric-500/20 hover:opacity-90 transition"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Launch Camera</span>
          </Link>
        )}

        {/* RAG Assistant Shortcut */}
        {pathname !== "/rag-assistant" && (
          <Link
            href="/rag-assistant"
            className="p-2 rounded-lg bg-navy-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            title="Ask RAG Knowledge Assistant"
          >
            <Sparkles className="w-4 h-4 text-electric-400" />
          </Link>
        )}
      </div>
    </header>
  );
};

