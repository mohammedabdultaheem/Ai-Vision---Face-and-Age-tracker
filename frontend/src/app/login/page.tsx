"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/authContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("superadmin@aivision.io");
  const [password, setPassword] = useState("SuperAdmin2026!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to authenticate. Verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const setPresetUser = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
  };

  return (
    <div className="min-h-screen bg-navy-950 bg-vision-mesh flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-electric-600 via-electric-500 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-electric-500/25">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">AI VISION</h2>
        <p className="mt-1 text-xs text-slate-400">Enterprise AI Face Detection & Age Estimation</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-slate-800 space-y-6">
          <div className="text-center pb-2 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Sign In to Enterprise Workspace</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Role-based access with verified authentication</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Corporate Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-electric-400 transition"
                  placeholder="name@aivision.io"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Password</label>
                <Link href="/forgot-password" className="text-electric-400 hover:underline text-[11px]">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-electric-400 transition"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-electric-500 to-accent-500 text-white font-semibold text-xs shadow-lg shadow-electric-500/20 hover:opacity-95 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Platform"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Role Credentials Picker for Testing */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
              Quick Test Credentials
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setPresetUser("superadmin@aivision.io", "SuperAdmin2026!")}
                className="p-2 rounded-lg bg-navy-900 hover:bg-slate-800 border border-slate-800 text-left transition"
              >
                <div className="font-bold text-electric-400">Super Admin</div>
                <div className="text-[10px] text-slate-400 truncate">superadmin@aivision.io</div>
              </button>
              <button
                type="button"
                onClick={() => setPresetUser("admin@aivision.io", "Admin2026!")}
                className="p-2 rounded-lg bg-navy-900 hover:bg-slate-800 border border-slate-800 text-left transition"
              >
                <div className="font-bold text-accent-400">Administrator</div>
                <div className="text-[10px] text-slate-400 truncate">admin@aivision.io</div>
              </button>
              <button
                type="button"
                onClick={() => setPresetUser("operator@aivision.io", "Operator2026!")}
                className="p-2 rounded-lg bg-navy-900 hover:bg-slate-800 border border-slate-800 text-left transition"
              >
                <div className="font-bold text-emerald-400">Operator</div>
                <div className="text-[10px] text-slate-400 truncate">operator@aivision.io</div>
              </button>
              <button
                type="button"
                onClick={() => setPresetUser("analyst@aivision.io", "Analyst2026!")}
                className="p-2 rounded-lg bg-navy-900 hover:bg-slate-800 border border-slate-800 text-left transition"
              >
                <div className="font-bold text-amber-400">Read-only Analyst</div>
                <div className="text-[10px] text-slate-400 truncate">analyst@aivision.io</div>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pt-2">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-electric-400 font-semibold hover:underline">
              Register now
            </Link>
          </div>
        </div>

        {/* Privacy Assurance Banner */}
        <div className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero Facial Biometric Persistence • GDPR & CCPA Compliant</span>
        </div>
      </div>
    </div>
  );
}

