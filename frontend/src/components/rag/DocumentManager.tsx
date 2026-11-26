"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Trash2,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  UploadCloud
} from "lucide-react";
import { api } from "@/lib/api";
import { RAGDocumentItem } from "@/lib/types";

export const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<RAGDocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("System Architecture");
  const [newContent, setNewContent] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await api.getRAGDocuments();
      setDocuments(docs);
    } catch (e) {
      console.warn("Could not load documents:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      await api.addRAGDocument({
        title: newTitle,
        category: newCategory,
        content: newContent,
      });
      setStatusMsg("Document indexed and vectorized successfully.");
      setShowModal(false);
      setNewTitle("");
      setNewContent("");
      loadDocuments();
    } catch (err: any) {
      setStatusMsg(`Failed to add document: ${err.message}`);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to remove this document from the knowledge base?")) return;
    try {
      await api.deleteRAGDocument(docId);
      loadDocuments();
    } catch (err: any) {
      alert("Failed to delete document: " + err.message);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-navy-900/80 border border-slate-800 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-electric-400" />
            Enterprise Knowledge Base Sources
          </h3>
          <p className="text-xs text-slate-400">
            Managed documentation ingested for semantic RAG retrieval and question answering
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-electric-500 hover:bg-electric-400 text-white text-xs font-semibold shadow-md shadow-electric-500/20 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ingest New Document</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Documents Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.doc_id}
            className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-electric-400 border border-slate-700">
                  {doc.category}
                </span>
                <button
                  onClick={() => handleDelete(doc.doc_id)}
                  className="p-1 text-slate-500 hover:text-red-400 transition"
                  title="Remove Document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h4 className="text-xs font-bold text-white truncate">{doc.title}</h4>
              <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                {doc.content.replace(/#/g, "").slice(0, 160)}...
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>{doc.chunk_count} Chunks • {doc.file_size_kb} KB</span>
              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Ingest Document Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-navy-900 border border-slate-700 p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Ingest New Enterprise Document</h3>
            <form onSubmit={handleCreateDocument} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Edge Deployment Optimization Manual"
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
                >
                  <option value="System Architecture">System Architecture</option>
                  <option value="Ethical AI & Limitations">Ethical AI & Limitations</option>
                  <option value="Evaluation & Metrics">Evaluation & Metrics</option>
                  <option value="Hardware & Troubleshooting">Hardware & Troubleshooting</option>
                  <option value="API & Developer">API & Developer</option>
                  <option value="Security & Privacy">Security & Privacy</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Document Content (Markdown)</label>
                <textarea
                  rows={8}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Enter markdown technical specifications or troubleshooting procedures..."
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-navy-850 hover:bg-slate-800 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-electric-500 hover:bg-electric-400 text-white font-semibold transition"
                >
                  Index & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

