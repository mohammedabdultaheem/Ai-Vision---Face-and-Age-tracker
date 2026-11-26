"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileImage,
  Trash2,
  Download,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";
import { DetectionAnalysisResponse, DetectedFace } from "@/lib/types";

export const ImageAnalysisWorkspace: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DetectionAnalysisResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (file: File) => {
    setErrorMsg(null);
    setAnalysisResult(null);

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Unsupported image format. Allowed formats: JPG, JPEG, PNG, WebP.");
      return;
    }

    // Validate size (15MB)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("File size exceeds 15MB limit.");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Auto-analyze
    triggerAnalysis(file);
  };

  const triggerAnalysis = async (file: File) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const res = await api.analyzeImage(file);
      setAnalysisResult(res);
      // Draw bounding boxes once image is rendered
      setTimeout(() => drawBoxes(res.faces), 150);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to analyze image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const drawBoxes = (faces: DetectedFace[]) => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    faces.forEach((face) => {
      const [x, y, w, h] = face.bbox;
      const isPoor = face.image_quality === "Poor";
      const isMod = face.image_quality === "Moderate";
      const strokeColor = isPoor ? "#EF4444" : isMod ? "#F59E0B" : "#38BDF8";

      // Draw box
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 4;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 10;
      ctx.strokeRect(x, y, w, h);

      // Landmarks if present
      if (face.landmarks) {
        ctx.fillStyle = "#A855F7";
        ctx.shadowBlur = 4;
        face.landmarks.forEach(([lx, ly]) => {
          ctx.beginPath();
          ctx.arc(lx, ly, 4, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      // Metadata Tag
      const genderDisplay = face.gender ? `${face.gender} (${(face.gender_confidence * 100).toFixed(0)}%)` : "";
      const tagText = `${face.face_id} • ${genderDisplay} • Age: ${face.age_range}`;
      const confText = `Det: ${(face.detection_confidence * 100).toFixed(0)}% • Age Conf: ${(face.age_confidence * 100).toFixed(0)}% • ${face.image_quality}`;
      ctx.shadowBlur = 0;
      ctx.font = "bold 15px Inter, sans-serif";
      const tagW = Math.max(ctx.measureText(tagText).width, ctx.measureText(confText).width) + 20;
      const tagH = 50;
      const tagY = Math.max(10, y - tagH - 8);

      ctx.fillStyle = "rgba(10, 15, 29, 0.92)";
      ctx.fillRect(x, tagY, tagW, tagH);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, tagY, tagW, tagH);

      ctx.fillStyle = face.gender === "Female" ? "#F472B6" : "#38BDF8";
      ctx.fillText(tagText, x + 10, tagY + 22);
      ctx.font = "12px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(confText, x + 10, tagY + 42);
    });
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setErrorMsg(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleDownloadReport = () => {
    if (!analysisResult) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysisResult, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ai_vision_analysis_${analysisResult.session_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-navy-900/80 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-accent-500/10 border border-accent-500/20 text-accent-400">
            <FileImage className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Image Upload & Multi-Face Analysis</h2>
            <p className="text-xs text-slate-400">
              Drag-and-drop or select an image to detect multiple faces and approximate biological age range
            </p>
          </div>
        </div>

        {analysisResult && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadReport}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-navy-850 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Analysis JSON</span>
            </button>
            <button
              onClick={handleClear}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-xs font-semibold text-red-300 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Image</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Dropzone / Preview Area */}
      {!previewUrl ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}
          className="p-12 border-2 border-dashed border-slate-700/80 hover:border-electric-400 rounded-2xl bg-navy-900/40 hover:bg-navy-900/70 transition flex flex-col items-center justify-center text-center cursor-pointer group"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/jpeg,image/png,image/webp";
            input.onchange = (e: any) => {
              if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
            };
            input.click();
          }}
        >
          <div className="w-16 h-16 rounded-2xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-center text-electric-400 group-hover:scale-110 transition duration-300 mb-4 shadow-lg shadow-electric-500/5">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="text-sm font-semibold text-white mb-1">
            Drag and drop your image here, or <span className="text-electric-400 underline">browse</span>
          </div>
          <div className="text-xs text-slate-400 max-w-sm">
            Supports JPG, JPEG, PNG, and WebP (up to 15MB). Image is processed ephemerally in RAM and never stored.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Image & Canvas Preview Container (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-navy-950 border border-slate-800 shadow-2xl flex items-center justify-center p-2 min-h-[400px]">
              <img
                ref={imgRef}
                src={previewUrl}
                alt="Analyzed capture"
                className="max-h-[600px] w-auto object-contain rounded-lg"
                onLoad={() => {
                  if (analysisResult) drawBoxes(analysisResult.faces);
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none p-2"
              />

              {isAnalyzing && (
                <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-10">
                  <div className="w-10 h-10 border-3 border-electric-400 border-t-transparent rounded-full animate-spin" />
                  <div className="text-xs font-semibold text-white tracking-wide">
                    Running Deep Neural Face Detection & Age Estimation...
                  </div>
                </div>
              )}
            </div>

            {/* Global Quality Warnings */}
            {analysisResult && analysisResult.global_warnings.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Image Quality Warnings
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  {analysisResult.global_warnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Analysis Summary & Detected Faces Card (1 Col) */}
          <div className="space-y-4">
            {/* Summary Metrics */}
            <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-electric-400" /> Analysis Summary
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {analysisResult?.processing_latency_ms || 0} ms
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-navy-950 border border-slate-800/70">
                  <div className="text-slate-400 text-[11px]">Total Faces</div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {analysisResult?.total_faces || 0}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-navy-950 border border-slate-800/70">
                  <div className="text-slate-400 text-[11px]">Inference Model</div>
                  <div className="text-xs font-semibold text-electric-400 mt-1 truncate">
                    YuNet + AgeNet
                  </div>
                </div>
              </div>

              {/* Face Results Accordion / List */}
              <div className="space-y-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Individual Detections
                </div>
                {analysisResult?.faces.length === 0 ? (
                  <div className="p-4 rounded-lg bg-navy-950 text-center text-xs text-slate-500">
                    No human faces localized in this photograph.
                  </div>
                ) : (
                  analysisResult?.faces.map((face) => (
                    <div
                      key={face.face_id}
                      className="p-3.5 rounded-lg bg-navy-950 border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-electric-400">{face.face_id}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            face.image_quality === "Good"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : face.image_quality === "Moderate"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {face.image_quality} Quality
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm font-bold text-white">
                        <span>Estimated Age: {face.age_range}</span>
                        {face.gender && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              face.gender === "Female"
                                ? "bg-pink-500/20 text-pink-400 border-pink-500/30"
                                : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            }`}
                          >
                            {face.gender} {face.gender_confidence ? `(${(face.gender_confidence * 100).toFixed(0)}%)` : ""}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                        <div>Age Conf: <span className="text-slate-200">{(face.age_confidence * 100).toFixed(0)}%</span></div>
                        <div>Det Conf: <span className="text-slate-200">{(face.detection_confidence * 100).toFixed(0)}%</span></div>
                      </div>

                      {/* Warnings if any */}
                      {face.quality_details.warnings.length > 0 && (
                        <div className="text-[10px] text-amber-400/90 pt-1">
                          • {face.quality_details.warnings[0]}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Privacy Guarantee Card */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" /> Zero-Retention Guarantee
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Facial imagery is evaluated strictly within transient memory. Once inference completes, the byte stream is discarded. No biometric profiles or templates are persisted.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

