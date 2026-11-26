"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [dispatched, setDispatched] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setDispatched(true);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 bg-vision-mesh flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-electric-600 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-electric-500/25">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Reset Account Access</h2>
        <p className="mt-1 text-xs text-slate-400">Enterprise AI Vision Recovery Service</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-slate-800 space-y-5 text-xs">
          {!dispatched ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Corporate Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-navy-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-electric-400"
                    placeholder="name@aivision.io"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-electric-500 to-accent-500 text-white font-semibold text-xs shadow-lg shadow-electric-500/20 hover:opacity-95 transition flex items-center justify-center space-x-2"
              >
                <span>Send Password Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="text-center space-y-3 py-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-sm font-semibold text-white">Recovery Instructions Sent</div>
              <p className="text-slate-400 text-xs">
                If <span className="text-electric-400">{email}</span> matches an enterprise record, an authorized recovery link has been dispatched.
              </p>
            </div>
          )}

          <div className="text-center pt-3 border-t border-slate-800">
            <Link href="/login" className="text-electric-400 font-semibold hover:underline">
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

