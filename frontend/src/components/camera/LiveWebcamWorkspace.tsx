"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Camera,
  CameraOff,
  RefreshCw,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  Download,
  Info,
  Maximize2
} from "lucide-react";
import { api } from "@/lib/api";
import { DetectedFace, DetectionAnalysisResponse } from "@/lib/types";

export const LiveWebcamWorkspace: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Hardware & Stream states
  const [isStreaming, setIsStreaming] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [streamError, setStreamError] = useState<string | null>(null);

  // Performance & Sampling controls
  const [sessionId] = useState(() => "webcam_" + Math.random().toString(36).substring(2, 9));
  const [samplingFps, setSamplingFps] = useState<number>(5);
  const [measuredFps, setMeasuredFps] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(0);

  // Analysis Results
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [globalWarnings, setGlobalWarnings] = useState<string[]>([]);
  const [sessionHistory, setSessionHistory] = useState<DetectedFace[]>([]);
  const [totalFramesProcessed, setTotalFramesProcessed] = useState<number>(0);

  // Enumerate camera devices
  const loadDevices = async () => {
    try {
      const devList = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devList.filter((d) => d.kind === "videoinput");
      setDevices(videoDevs);
      if (videoDevs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevs[0].deviceId);
      }
    } catch (e) {
      console.error("Device enumeration error:", e);
    }
  };

  useEffect(() => {
    loadDevices();
    return () => {
      stopCamera();
    };
  }, []);

  // Start Camera Stream
  const startCamera = async (devId?: string) => {
    setStreamError(null);
    try {
      const targetDevId = devId || selectedDeviceId;
      const constraints: MediaStreamConstraints = {
        video: targetDevId
          ? { deviceId: { exact: targetDevId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false, // Strict privacy: never capture audio
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        // Fallback to generic video if exact constraint fails
        console.warn("Target constraint failed, falling back to basic video stream:", firstErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
      await loadDevices();
    } catch (err: any) {
      console.error("Webcam access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setStreamError("Camera permission was denied. Please grant browser camera access to proceed.");
      } else if (err.name === "NotReadableError") {
        setStreamError("Camera is currently occupied by another application (e.g. Teams, Zoom, OBS).");
      } else {
        setStreamError(`Failed to access camera: ${err.message || "Unknown error"}`);
      }
      setIsStreaming(false);
    }
  };

  // Immediate Stop Kill Switch
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setDetectedFaces([]);
    setGlobalWarnings([]);
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Switch Target Camera
  const handleDeviceChange = (devId: string) => {
    setSelectedDeviceId(devId);
    if (isStreaming) {
      stopCamera();
      setTimeout(() => startCamera(devId), 200);
    }
  };

  // Frame Capture & Real-time Inference Loop
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let isProcessing = false;
    let lastFrameTime = performance.now();

    const sampleAndAnalyze = async () => {
      if (!isStreaming || !videoRef.current || !canvasRef.current || isProcessing) return;
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) return;

      isProcessing = true;
      const startT = performance.now();

      try {
        // Offscreen capture
        const offCanvas = document.createElement("canvas");
        offCanvas.width = video.videoWidth;
        offCanvas.height = video.videoHeight;
        const ctx = offCanvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);

        // Convert to blob and send to FastAPI inference endpoint
        const blob = await new Promise<Blob | null>((resolve) =>
          offCanvas.toBlob(resolve, "image/jpeg", 0.85)
        );

        if (blob) {
          const formData = new FormData();
          formData.append("file", blob, "frame.jpg");
          formData.append("session_id", sessionId);

          const result: DetectionAnalysisResponse = await api.analyzeFrame(formData);

          // Update measured metrics
          const duration = Math.round(performance.now() - startT);
          setLatencyMs(duration);
          const currentT = performance.now();
          const fps = 1000 / (currentT - lastFrameTime);
          lastFrameTime = currentT;
          setMeasuredFps(Math.round(fps));
          setTotalFramesProcessed((prev) => prev + 1);

          setDetectedFaces(result.faces);
          setGlobalWarnings(result.global_warnings);

          // Append to detection history
          if (result.faces.length > 0) {
            setSessionHistory((prev) => [...result.faces, ...prev].slice(0, 30));
          }

          // Draw Overlay
          drawBoundingBoxes(result.faces, video.videoWidth, video.videoHeight);
        }
      } catch (e: any) {
        console.warn("Inference frame error:", e);
        setGlobalWarnings([
          "Inference backend unreachable. Please ensure the FastAPI server is running on http://localhost:8000."
        ]);
      } finally {
        isProcessing = false;
      }
    };

    if (isStreaming) {
      const interval = Math.max(50, Math.round(1000 / samplingFps));
      timer = setInterval(sampleAndAnalyze, interval);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isStreaming, samplingFps]);

  // Canvas Overlay Drawing
  const drawBoundingBoxes = (faces: DetectedFace[], videoW: number, videoH: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (canvas.width !== videoW || canvas.height !== videoH) {
      canvas.width = videoW;
      canvas.height = videoH;
    }
    ctx.clearRect(0, 0, videoW, videoH);

    faces.forEach((face) => {
      const [x, y, w, h] = face.bbox;
      const isPoor = face.image_quality === "Poor";
      const isModerate = face.image_quality === "Moderate";

      // Box Styling
      const strokeColor = isPoor ? "#EF4444" : isModerate ? "#F59E0B" : "#38BDF8";
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 12;

      // Draw rounded rectangle
      ctx.strokeRect(x, y, w, h);

      // Draw corner brackets
      const len = Math.min(20, w / 4);
      ctx.lineWidth = 5;
      // Top-Left
      ctx.beginPath(); ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
      // Top-Right
      ctx.beginPath(); ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len); ctx.stroke();
      // Bottom-Left
      ctx.beginPath(); ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h); ctx.stroke();
      // Bottom-Right
      ctx.beginPath(); ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len); ctx.stroke();

      // Landmarks dots if available
      if (face.landmarks) {
        ctx.fillStyle = "#A855F7";
        ctx.shadowBlur = 4;
        face.landmarks.forEach(([lx, ly]) => {
          ctx.beginPath();
          ctx.arc(lx, ly, 3.5, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      // Metadata Tag Banner above box
      const genderDisplay = face.gender ? `${face.gender} (${(face.gender_confidence * 100).toFixed(0)}%)` : "";
      const tagText = `${face.face_id} • ${genderDisplay} • Age: ${face.age_range}`;
      const confText = `Age Conf: ${(face.age_confidence * 100).toFixed(0)}% | Det: ${(face.detection_confidence * 100).toFixed(0)}% | ${face.image_quality}`;
      
      ctx.shadowBlur = 0;
      ctx.font = "bold 13px Inter, sans-serif";
      const textWidth = Math.max(ctx.measureText(tagText).width, ctx.measureText(confText).width) + 16;
      const tagHeight = 44;
      const tagY = Math.max(10, y - tagHeight - 6);

      // Tag Background
      ctx.fillStyle = "rgba(10, 15, 29, 0.92)";
      ctx.fillRect(x, tagY, textWidth, tagHeight);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, tagY, textWidth, tagHeight);

      // Tag Text
      ctx.fillStyle = face.gender === "Female" ? "#F472B6" : "#38BDF8";
      ctx.fillText(tagText, x + 8, tagY + 18);
      ctx.font = "11px Inter, sans-serif";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(confText, x + 8, tagY + 36);
    });
  };

  // Snapshot Capture
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const link = document.createElement("a");
    link.download = `ai_vision_capture_${Date.now()}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header & Hardware Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-navy-900/80 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-electric-500/10 border border-electric-500/20 text-electric-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Real-Time Camera Workspace
              {isStreaming && (
                <span className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> LIVE
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Ephemeral frame inference using OpenCV YuNet ONNX & GoogleNet AgeNet
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Camera Device Dropdown */}
          <select
            value={selectedDeviceId}
            onChange={(e) => handleDeviceChange(e.target.value)}
            disabled={devices.length === 0}
            className="text-xs bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-electric-400"
          >
            {devices.map((d, idx) => (
              <option key={d.deviceId || idx} value={d.deviceId}>
                {d.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>

          {/* Start / Stop Buttons */}
          {!isStreaming ? (
            <button
              onClick={() => startCamera()}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-electric-500 to-accent-500 text-white text-xs font-semibold shadow-lg shadow-electric-500/20 hover:opacity-95 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/20 transition"
            >
              <CameraOff className="w-4 h-4" />
              <span>Stop Camera</span>
            </button>
          )}

          {/* Snapshot Button */}
          {isStreaming && (
            <button
              onClick={handleCaptureSnapshot}
              className="p-2 rounded-lg bg-navy-850 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
              title="Capture Image Snapshot"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Permission / Hardware Error Alert */}
      {streamError && (
        <div className="flex items-start space-x-3 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-red-200">Hardware Access Alert</div>
            <div>{streamError}</div>
          </div>
        </div>
      )}

      {/* Main Video Viewport & Stats Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Camera Viewport (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-navy-950 border border-slate-800 shadow-2xl aspect-video flex items-center justify-center">
            {/* Live Video */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-contain ${!isStreaming ? "hidden" : "block"}`}
            />

            {/* Canvas Overlay for Bounding Boxes */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${
                !isStreaming ? "hidden" : "block"
              }`}
            />

            {/* Offline Viewport Placeholder */}
            {!isStreaming && (
              <div className="text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-navy-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 shadow-inner">
                  <Camera className="w-8 h-8 text-slate-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-300">Camera Viewport Inactive</div>
                  <div className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Click &ldquo;Start Camera&rdquo; above to initialize live multi-face detection and continuous age estimation.
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Telemetry HUD (Overlaid on Video) */}
            {isStreaming && (
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-navy-950/90 border border-slate-700/80 text-[11px] font-mono text-slate-200 flex items-center gap-1.5 shadow">
                  <Clock className="w-3 h-3 text-electric-400" />
                  {latencyMs} ms
                </span>
                <span className="px-2.5 py-1 rounded-md bg-navy-950/90 border border-slate-700/80 text-[11px] font-mono text-slate-200 flex items-center gap-1.5 shadow">
                  <Sliders className="w-3 h-3 text-accent-400" />
                  {measuredFps} FPS
                </span>
                <span className="px-2.5 py-1 rounded-md bg-navy-950/90 border border-slate-700/80 text-[11px] font-mono text-slate-200 flex items-center gap-1.5 shadow">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  {detectedFaces.length} Face{detectedFaces.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Quality Warnings Advisory Banner */}
          {globalWarnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Quality Advisory
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                {globalWarnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sampling & Processing Sliders */}
          <div className="p-4 rounded-xl bg-navy-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Sliders className="w-4 h-4 text-electric-400" />
              <div>
                <div className="text-xs font-semibold text-slate-200">Frame Sampling Rate</div>
                <div className="text-[11px] text-slate-400">Controls inference frequency over camera stream</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-64">
              <input
                type="range"
                min="1"
                max="15"
                value={samplingFps}
                onChange={(e) => setSamplingFps(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-electric-500"
              />
              <span className="text-xs font-mono font-bold text-electric-400 w-12 text-right">
                {samplingFps} FPS
              </span>
            </div>
          </div>
        </div>

        {/* Live Detections List & Session History (1 Col) */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-navy-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-electric-400" /> Detected Faces
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {detectedFaces.length} Active
              </span>
            </div>

            {/* List of currently detected faces */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {detectedFaces.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No visible faces in current frame
                </div>
              ) : (
                detectedFaces.map((face) => (
                  <div
                    key={face.face_id}
                    className="p-3 rounded-lg bg-navy-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-electric-400">{face.face_id}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          face.image_quality === "Good"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : face.image_quality === "Moderate"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {face.image_quality} Quality
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-white">
                      <span>Age: {face.age_range}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          face.gender === "Female"
                            ? "bg-pink-500/20 text-pink-400 border-pink-500/30"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {face.gender} ({(face.gender_confidence * 100).toFixed(0)}%)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <div>
                        Conf: <span className="text-slate-200">{(face.age_confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        Latency: <span className="text-slate-200">{face.processing_time_ms} ms</span>
                      </div>
                    </div>

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

          {/* Privacy Posture Card */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero Biometric Storage</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Camera frames are evaluated in ephemeral volatile memory (RAM). No raw imagery, biometric templates, or embeddings are written to persistent disk storage.
            </p>
          </div>
        </div>
      </div>

      {/* Detection Session History Table */}
      <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Session Detection History
            </h3>
            <p className="text-[11px] text-slate-400">
              Ephemeral log of face detections captured during this browser session
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Frames Sampled: {totalFramesProcessed}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Face ID</th>
                <th className="p-3">Gender</th>
                <th className="p-3">Estimated Age Range</th>
                <th className="p-3">Age Confidence</th>
                <th className="p-3">Detection Confidence</th>
                <th className="p-3">Image Quality</th>
                <th className="p-3">Processing Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sessionHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-500">
                    No detections recorded yet in current session.
                  </td>
                </tr>
              ) : (
                sessionHistory.slice(0, 10).map((hFace, idx) => (
                  <tr key={idx} className="hover:bg-navy-850/50 transition">
                    <td className="p-3 font-semibold text-electric-400">{hFace.face_id}</td>
                    <td className="p-3 font-semibold text-white">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        hFace.gender === "Female" ? "bg-pink-500/20 text-pink-400" : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {hFace.gender || "Undetermined"}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-white">{hFace.age_range}</td>
                    <td className="p-3 font-mono">{(hFace.age_confidence * 100).toFixed(1)}%</td>
                    <td className="p-3 font-mono">{(hFace.detection_confidence * 100).toFixed(1)}%</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          hFace.image_quality === "Good"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : hFace.image_quality === "Moderate"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {hFace.image_quality}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">{hFace.processing_time_ms} ms</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

