export type UserRole = 
  | "Super Administrator" 
  | "Administrator" 
  | "Operator" 
  | "Read-only Analyst";

export interface User {
  id: number;
  uuid: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface QualityAssessment {
  score: "Good" | "Moderate" | "Poor";
  brightness: number;
  sharpness: number;
  resolution_w: number;
  resolution_h: number;
  warnings: string[];
}

export interface DetectedFace {
  face_id: string;
  face_status: string;
  age_range: string;
  age_confidence: number;
  gender: "Male" | "Female" | "Undetermined";
  gender_confidence: number;
  detection_confidence: number;
  image_quality: "Good" | "Moderate" | "Poor";
  quality_details: QualityAssessment;
  bbox: [number, number, number, number]; // [x, y, w, h]
  landmarks?: number[][];
  processing_time_ms: number;
}

export interface DetectionAnalysisResponse {
  session_id: string;
  timestamp: string;
  total_faces: number;
  faces: DetectedFace[];
  processing_latency_ms: number;
  fps_estimate: number;
  global_warnings: string[];
  privacy_notice: string;
}

export interface ModelRegistryItem {
  id: number;
  model_name: string;
  model_type: "face_detection" | "age_estimation";
  architecture: string;
  version: string;
  model_size: string;
  dataset_provenance: string;
  license: string;
  status: "active" | "staging" | "inactive" | "testing";
  mae: number;
  rmse: number;
  range_accuracy: number;
  latency_ms: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatasetItem {
  id: number;
  name: string;
  description?: string;
  sample_count: number;
  license: string;
  consent_verified: boolean;
  label_status: string;
  file_size_mb: number;
  created_at: string;
}

export interface TrainingJobItem {
  id: number;
  job_uuid: string;
  job_name: string;
  dataset_id?: number;
  base_model: string;
  status: "pending" | "validating" | "ready" | "training" | "completed" | "failed";
  epochs: number;
  batch_size: number;
  learning_rate: number;
  validation_split: number;
  current_epoch: number;
  current_loss: number;
  current_val_acc: number;
  created_at: string;
  completed_at?: string;
}

export interface SourceCitation {
  document_title: string;
  category: string;
  relevance_score: number;
  excerpt: string;
}

export interface RAGResponse {
  query: string;
  answer: string;
  citations: SourceCitation[];
  confidence: number;
  model_used: string;
  disclaimer: string;
}

export interface RAGDocumentItem {
  id: number;
  doc_id: string;
  title: string;
  category: string;
  content: string;
  chunk_count: number;
  file_size_kb: number;
  author: string;
  is_active: boolean;
  created_at: string;
}

export interface OverviewMetrics {
  total_sessions: number;
  total_faces: number;
  avg_latency_ms: number;
  current_model: string;
  model_health: string;
  total_api_requests: number;
  failed_requests: number;
  system_uptime: string;
  quality_breakdown: Record<string, number>;
  age_distribution: Record<string, number>;
}

export interface AuditLogItem {
  id: number;
  user_email: string;
  action: string;
  resource: string;
  status: string;
  details?: string;
  ip_address: string;
  created_at: string;
}

export interface SystemHealth {
  status: string;
  version: string;
  cpu_percent: number;
  memory_percent: number;
  models_loaded: Record<string, boolean>;
  database_connected: boolean;
  rag_active: boolean;
  privacy_mode: string;
}

