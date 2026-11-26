from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# --- Auth Schemas ---
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "Operator"
    department: Optional[str] = "AI Operations"

class ForgotPasswordRequest(BaseModel):
    email: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_name: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    uuid: str
    email: str
    full_name: str
    role: str
    department: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    department: Optional[str] = None

# --- Detection & Analysis Schemas ---
class QualityAssessment(BaseModel):
    score: str  # Good, Moderate, Poor
    brightness: float
    sharpness: float
    resolution_w: int
    resolution_h: int
    warnings: List[str] = []

class DetectedFace(BaseModel):
    face_id: str
    face_status: str = "Detected"
    age_range: str
    age_confidence: float
    gender: str = "Undetermined"
    gender_confidence: float = 0.50
    detection_confidence: float
    image_quality: str
    quality_details: QualityAssessment
    bbox: List[int]  # [x, y, w, h]
    landmarks: Optional[List[List[int]]] = None
    processing_time_ms: float

class DetectionAnalysisResponse(BaseModel):
    session_id: str
    timestamp: str
    total_faces: int
    faces: List[DetectedFace]
    processing_latency_ms: float
    fps_estimate: float
    global_warnings: List[str] = []
    privacy_notice: str = "Raw facial imagery processed ephemerally in RAM and purged immediately post-inference."

# --- AI Model Registry Schemas ---
class ModelResponse(BaseModel):
    id: int
    model_name: str
    model_type: str
    architecture: str
    version: str
    model_size: str
    dataset_provenance: str
    license: str
    status: str
    mae: float
    rmse: float
    range_accuracy: float
    latency_ms: float
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ModelRegisterRequest(BaseModel):
    model_name: str
    model_type: str
    architecture: str
    version: str
    dataset_provenance: str
    license: str
    description: Optional[str] = ""

class ModelDeployRequest(BaseModel):
    model_id: int
    target_environment: str = "production"  # development, staging, production

# --- Dataset & Training Schemas ---
class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    sample_count: int
    license: str
    consent_verified: bool = True

class DatasetResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    sample_count: int
    license: str
    consent_verified: bool
    label_status: str
    file_size_mb: float
    created_at: datetime

    class Config:
        from_attributes = True

class TrainingStartRequest(BaseModel):
    job_name: str
    dataset_id: int
    base_model: str = "YuNet + Age-GoogleNet"
    epochs: int = Field(default=10, ge=1, le=100)
    batch_size: int = Field(default=32, ge=8, le=128)
    learning_rate: float = Field(default=0.001, gt=0)
    validation_split: float = Field(default=0.2, gt=0, lt=0.5)

class TrainingJobResponse(BaseModel):
    id: int
    job_uuid: str
    job_name: str
    dataset_id: Optional[int]
    base_model: str
    status: str
    epochs: int
    batch_size: int
    learning_rate: float
    validation_split: float
    current_epoch: int
    current_loss: float
    current_val_acc: float
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

# --- RAG Schemas ---
class SourceCitation(BaseModel):
    document_title: str
    category: str
    relevance_score: float
    excerpt: str

class RAGQueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

class RAGQueryResponse(BaseModel):
    query: str
    answer: str
    citations: List[SourceCitation]
    confidence: float
    model_used: str
    disclaimer: str = "This response is retrieved from verified enterprise documentation. RAG operates independently of the computer vision CNN."

class DocumentCreate(BaseModel):
    title: str
    category: str
    content: str
    author: Optional[str] = "System Administrator"

class DocumentResponse(BaseModel):
    id: int
    doc_id: str
    title: str
    category: str
    content: str
    chunk_count: int
    file_size_kb: float
    author: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Analytics & Reporting Schemas ---
class AnalyticsOverview(BaseModel):
    total_sessions: int
    total_faces: int
    avg_latency_ms: float
    current_model: str
    model_health: str
    total_api_requests: int
    failed_requests: int
    system_uptime: str
    quality_breakdown: Dict[str, int]
    age_distribution: Dict[str, int]

class PerformanceMetrics(BaseModel):
    latency_history: List[Dict[str, Any]]
    detection_trend: List[Dict[str, Any]]
    model_accuracy_by_quality: Dict[str, float]

class AuditLogResponse(BaseModel):
    id: int
    user_email: str
    action: str
    resource: str
    status: str
    details: Optional[str]
    ip_address: str
    created_at: datetime

    class Config:
        from_attributes = True

class SystemHealthResponse(BaseModel):
    status: str
    version: str
    cpu_percent: float
    memory_percent: float
    models_loaded: Dict[str, bool]
    database_connected: bool
    rag_active: bool
    privacy_mode: str
