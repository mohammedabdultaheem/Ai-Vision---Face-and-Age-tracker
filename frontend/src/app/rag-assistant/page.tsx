"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatInterface } from "@/components/rag/ChatInterface";
import { DocumentManager } from "@/components/rag/DocumentManager";
import { Sparkles, BookOpen, ShieldCheck } from "lucide-react";

export default function RAGAssistantPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "docs">("chat");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === "chat"
                ? "bg-electric-500 text-white shadow-lg shadow-electric-500/20"
                : "text-slate-400 hover:text-white bg-navy-900/60"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Interactive Knowledge Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === "docs"
                ? "bg-electric-500 text-white shadow-lg shadow-electric-500/20"
                : "text-slate-400 hover:text-white bg-navy-900/60"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Indexed Enterprise Documents</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "chat" ? <ChatInterface /> : <DocumentManager />}
      </div>
    </DashboardLayout>
  );
}

