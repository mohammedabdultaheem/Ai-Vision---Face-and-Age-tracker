"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, User, Mail, Lock, Building, ArrowRight, AlertTriangle, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("AI Operations");
  const [role, setRole] = useState("Operator");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.register({
        email,
        password,
        full_name: fullName,
        role,
        department,
      });
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 bg-vision-mesh flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-electric-600 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-electric-500/25">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Create Enterprise Account</h2>
        <p className="mt-1 text-xs text-slate-400">Join the AI VISION Computer Vision Platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-slate-800 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-electric-400"
                  placeholder="Dr. Katherine Smith"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-electric-400"
                  placeholder="katherine@aivision.io"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-electric-400"
                  placeholder="Min 8 characters"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-electric-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Initial Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-electric-400"
                >
                  <option value="Operator">Operator</option>
                  <option value="Read-only Analyst">Read-only Analyst</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-electric-500 to-accent-500 text-white font-semibold text-xs shadow-lg shadow-electric-500/20 hover:opacity-95 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? "Registering..." : "Create Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
            Already registered?{" "}
            <Link href="/login" className="text-electric-400 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

