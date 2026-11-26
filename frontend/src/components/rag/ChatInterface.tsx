"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Cpu,
  Layers,
  Camera,
  Key
} from "lucide-react";
import { api } from "@/lib/api";
import { RAGResponse, SourceCitation } from "@/lib/types";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  citations?: SourceCitation[];
  modelUsed?: string;
  confidence?: number;
  timestamp: string;
}

const PRESET_QUESTIONS = [
  { label: "Explain CV Pipeline", query: "Explain the computer vision pipeline architecture from frame input to calibrated age output." },
  { label: "Age Estimation Limitations", query: "What are the scientific limitations of predicting age from facial morphology?" },
  { label: "Evaluation Metrics", query: "How are MAE and RMSE calculated for model evaluation?" },
  { label: "Camera Troubleshooting", query: "How do I troubleshoot camera permission denied or hardware in use errors?" },
  { label: "Model Deployment & Rollback", query: "What is the procedure for rolling back an AI model in production?" },
  { label: "Zero-Retention Privacy", query: "How does the platform ensure biometric data and facial images are not retained?" },
];

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: (
        "Welcome to the **AI VISION Enterprise Knowledge Assistant**. " +
        "I am connected to verified platform architectural specifications, evaluation benchmarks, and privacy compliance guidelines.\n\n" +
        "Ask me any question regarding model pipelines, evaluation metrics, hardware troubleshooting, or deployment protocols below."
      ),
      modelUsed: "AI VISION Verified Grounded Engine",
      confidence: 1.0,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (queryToSend?: string) => {
    const q = queryToSend || inputQuery;
    if (!q.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryToSend) setInputQuery("");
    setIsLoading(true);

    try {
      const res: RAGResponse = await api.queryRAG(q);
      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        text: res.answer,
        citations: res.citations,
        modelUsed: res.model_used,
        confidence: res.confidence,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "assistant",
        text: "I encountered an error querying the verified knowledge index. Please check that the backend service is reachable.",
        confidence: 0.0,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[750px] rounded-2xl bg-navy-900/80 border border-slate-800 shadow-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-navy-950/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-600 to-electric-500 flex items-center justify-center text-white shadow-md shadow-accent-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              RAG Knowledge Assistant
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                Grounded Citations
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Retrieves authoritative architectural manuals, API specs, and compliance documents
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: "welcome",
                sender: "assistant",
                text: "Conversation refreshed. How may I assist you with the AI VISION platform today?",
                confidence: 1.0,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ])
          }
          className="p-2 rounded-lg bg-navy-850 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          title="Clear Conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Topic Chips */}
      <div className="px-6 py-2.5 bg-navy-950/40 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 flex-shrink-0">
          <HelpCircle className="w-3.5 h-3.5 text-electric-400" /> Suggested:
        </span>
        {PRESET_QUESTIONS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(item.query)}
            disabled={isLoading}
            className="flex-shrink-0 px-2.5 py-1 rounded-full bg-navy-850 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition text-[11px]"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Message History Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-2xl rounded-2xl p-4 space-y-3 ${
                msg.sender === "user"
                  ? "bg-gradient-to-r from-electric-600 to-electric-500 text-white shadow-lg shadow-electric-500/10"
                  : "bg-navy-950/90 border border-slate-800 text-slate-200 shadow-md"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] opacity-75 pb-1 border-b border-white/10">
                <span className="font-semibold flex items-center gap-1">
                  {msg.sender === "user" ? "Administrator" : "AI VISION RAG Engine"}
                  {msg.confidence !== undefined && msg.sender === "assistant" && (
                    <span className="ml-2 font-mono text-[10px] text-emerald-400">
                      • {(msg.confidence * 100).toFixed(0)}% Relevance
                    </span>
                  )}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Body */}
              <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                {msg.text}
              </div>

              {/* Source Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-accent-400" /> Verified Sources & Citations
                  </div>
                  <div className="space-y-1.5">
                    {msg.citations.map((cite, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-2.5 rounded-lg bg-navy-900 border border-slate-800/80 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between font-semibold text-electric-400">
                          <span>{cite.document_title}</span>
                          <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800">
                            {cite.category} • {(cite.relevance_score * 100).toFixed(0)}% match
                          </span>
                        </div>
                        <div className="text-slate-400 italic text-[11px]">
                          &ldquo;{cite.excerpt}&rdquo;
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-4 rounded-2xl bg-navy-950 border border-slate-800 flex items-center space-x-2 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-electric-400 animate-spin" />
              <span>Retrieving grounded technical documentation and synthesizing response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Prompt Box */}
      <div className="p-4 border-t border-slate-800 bg-navy-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-3"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about computer vision architecture, camera troubleshooting, model metrics, or deployment..."
            className="flex-1 text-xs bg-navy-900 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-electric-400 transition"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-electric-500 to-accent-500 text-white text-xs font-semibold shadow-lg shadow-electric-500/20 hover:opacity-95 transition disabled:opacity-40 flex items-center space-x-1.5"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Zero Biometric Access: RAG queries operate strictly on documentation
          </span>
          <span>Independent from CNN age inference</span>
        </div>
      </div>
    </div>
  );
};

