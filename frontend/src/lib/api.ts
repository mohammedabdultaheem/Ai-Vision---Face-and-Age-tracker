import { 
  User, 
  DetectionAnalysisResponse, 
  ModelRegistryItem, 
  DatasetItem, 
  TrainingJobItem, 
  RAGResponse, 
  RAGDocumentItem, 
  OverviewMetrics, 
  AuditLogItem, 
  SystemHealth 
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private getHeaders(isFormData = false): HeadersInit {
    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("aivision_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  // Auth Endpoints
  async login(email: string, password: string):Promise<{ access_token: string; role: string; user_name: string; email: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Authentication failed");
    }
    return res.json();
  }

  async register(data: { email: string; password: string; full_name: string; role?: string; department?: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(err.detail || "Registration failed");
    }
    return res.json();
  }

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch user profile");
    return res.json();
  }

  async logout(): Promise<void> {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: this.getHeaders(),
    }).catch(() => {});
    if (typeof window !== "undefined") {
      localStorage.removeItem("aivision_token");
      localStorage.removeItem("aivision_user");
    }
  }

  // Face Detection Endpoints
  async analyzeFrame(formData: FormData): Promise<DetectionAnalysisResponse> {
    const res = await fetch(`${API_BASE}/detection/analyze`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Frame analysis failed" }));
      throw new Error(err.detail || "Analysis failed");
    }
    return res.json();
  }

  async analyzeImage(file: File): Promise<DetectionAnalysisResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/detection/image`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Image upload failed" }));
      throw new Error(err.detail || "Image analysis failed");
    }
    return res.json();
  }

  async getDetectionStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/detection/status`);
    if (!res.ok) throw new Error("Could not reach detection service");
    return res.json();
  }

  // Model Registry Endpoints
  async getModels(): Promise<ModelRegistryItem[]> {
    const res = await fetch(`${API_BASE}/models/`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error("Failed to load models");
    return res.json();
  }

  async registerModel(data: Partial<ModelRegistryItem>): Promise<ModelRegistryItem> {
    const res = await fetch(`${API_BASE}/models/register`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to register model");
    return res.json();
  }

  async validateModel(modelId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/models/validate?model_id=${modelId}`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error("Validation check failed");
    return res.json();
  }

  async deployModel(modelId: number, targetEnvironment = "production"): Promise<any> {
    const res = await fetch(`${API_BASE}/models/deploy`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ model_id: modelId, target_environment: targetEnvironment }),
    });
    if (!res.ok) throw new Error("Deployment failed");
    return res.json();
  }

  async rollbackModel(modelType = "age_estimation"): Promise<any> {
    const res = await fetch(`${API_BASE}/models/rollback?model_type=${modelType}`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error("Rollback failed");
    return res.json();
  }

  // Training & Datasets Endpoints
  async getDatasets(): Promise<DatasetItem[]> {
    const res = await fetch(`${API_BASE}/training/datasets`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error("Failed to load datasets");
    return res.json();
  }

  async createDataset(data: Partial<DatasetItem>): Promise<DatasetItem> {
    const res = await fetch(`${API_BASE}/training/datasets`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to register dataset");
    return res.json();
  }

  async getTrainingJobs(): Promise<TrainingJobItem[]> {
    const res = await fetch(`${API_BASE}/training/jobs`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch training jobs");
    return res.json();
  }

  async startTrainingJob(config: { job_name: string; dataset_id: number; epochs: number; batch_size: number; learning_rate: number; validation_split: number }): Promise<TrainingJobItem> {
    const res = await fetch(`${API_BASE}/training/start`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error("Failed to start training job");
    return res.json();
  }

  async getTrainingLogs(jobId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/training/jobs/${jobId}/logs`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch job logs");
    return res.json();
  }

  // RAG Knowledge Assistant Endpoints
  async queryRAG(query: string): Promise<RAGResponse> {
    const res = await fetch(`${API_BASE}/rag/query`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error("RAG query failed");
    return res.json();
  }

  async getRAGDocuments(): Promise<RAGDocumentItem[]> {
    const res = await fetch(`${API_BASE}/rag/documents`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch RAG documents");
    return res.json();
  }

  async addRAGDocument(data: { title: string; category: string; content: string }): Promise<RAGDocumentItem> {
    const res = await fetch(`${API_BASE}/rag/documents`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add document");
    return res.json();
  }

  async deleteRAGDocument(docId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/rag/documents/${docId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete document");
    return res.json();
  }

  // Analytics & Reports Endpoints
  async getAnalyticsOverview(days = 30): Promise<OverviewMetrics> {
    const res = await fetch(`${API_BASE}/analytics/overview?days=${days}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error("Failed to load analytics overview");
    return res.json();
  }

  async getPerformance(days = 7): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/performance?days=${days}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error("Failed to load performance metrics");
    return res.json();
  }

  async getReports(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/reports/`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error("Failed to load reports");
    return res.json();
  }

  getExportUrl(): string {
    return `${API_BASE}/reports/export`;
  }

  // Security & Users Endpoints
  async getAuditLogs(limit = 100): Promise<AuditLogItem[]> {
    const res = await fetch(`${API_BASE}/security/audit-logs?limit=${limit}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error("Failed to load audit logs");
    return res.json();
  }

  async getPrivacySettings(): Promise<any> {
    const res = await fetch(`${API_BASE}/security/privacy-settings`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error("Failed to load privacy settings");
    return res.json();
  }

  async updatePrivacySettings(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/security/privacy-settings`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update privacy settings");
    return res.json();
  }

  async getApiKeys(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/security/api-keys`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error("Failed to load API keys");
    return res.json();
  }

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users/`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error("Failed to load users");
    return res.json();
  }

  async updateUser(userId: number, data: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update user");
    return res.json();
  }

  // System & Health Endpoints
  async getSystemHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/system/health`);
    if (!res.ok) throw new Error("Failed to fetch system health");
    return res.json();
  }

  async getSystemMetrics(): Promise<any> {
    const res = await fetch(`${API_BASE}/system/metrics`);
    if (!res.ok) throw new Error("Failed to fetch system metrics");
    return res.json();
  }

  async getSystemSettings(): Promise<any> {
    const res = await fetch(`${API_BASE}/system/settings`);
    if (!res.ok) throw new Error("Failed to fetch system settings");
    return res.json();
  }

  async updateSystemSettings(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/system/settings`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update settings");
    return res.json();
  }
}

export const api = new ApiClient();

