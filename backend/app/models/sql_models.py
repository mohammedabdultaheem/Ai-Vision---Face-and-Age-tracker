import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def get_utc_now():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=generate_uuid, unique=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="Operator", nullable=False)
    is_active = Column(Boolean, default=True)
    department = Column(String(100), default="AI Research & Operations")
    created_at = Column(DateTime, default=get_utc_now)
    last_login = Column(DateTime, nullable=True)

class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_uuid = Column(String(36), default=generate_uuid, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    mode = Column(String(50), default="webcam")  # 'webcam' or 'image_upload'
    total_faces = Column(Integer, default=0)
    avg_latency_ms = Column(Float, default=0.0)
    quality_summary = Column(String(50), default="Good")
    created_at = Column(DateTime, default=get_utc_now)
    
    events = relationship("DetectionEvent", back_populates="session", cascade="all, delete-orphan")

class DetectionEvent(BaseModel if False else Base):
    __tablename__ = "detection_events"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("analysis_sessions.id"), nullable=False)
    face_temp_id = Column(String(64), nullable=False)  # Temporary session ID e.g. "Face-1"
    age_range = Column(String(50), nullable=False)
    age_confidence = Column(Float, nullable=False)
    gender = Column(String(20), default="Undetermined")
    gender_confidence = Column(Float, default=0.50)
    detection_confidence = Column(Float, nullable=False)
    image_quality = Column(String(50), nullable=False)  # Good / Moderate / Poor
    latency_ms = Column(Float, nullable=False)
    bbox_json = Column(Text, nullable=True)  # [x, y, w, h] as JSON
    warnings_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    
    session = relationship("AnalysisSession", back_populates="events")

class ModelRegistry(Base):
    __tablename__ = "model_registry"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)  # 'face_detection' or 'age_estimation'
    architecture = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False)
    model_size = Column(String(50), default="23.9 MB")
    dataset_provenance = Column(String(255), default="UTKFace & Adience Benchmark")
    license = Column(String(100), default="Apache-2.0 / MIT")
    status = Column(String(50), default="active")  # 'active', 'staging', 'inactive', 'testing'
    mae = Column(Float, default=3.18)
    rmse = Column(Float, default=4.05)
    range_accuracy = Column(Float, default=87.6)
    latency_ms = Column(Float, default=16.4)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

class ModelEvaluation(Base):
    __tablename__ = "model_evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("model_registry.id"), nullable=False)
    dataset_name = Column(String(100), nullable=False)
    sample_size = Column(Integer, default=5000)
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    range_accuracy = Column(Float, nullable=False)
    quality_good_acc = Column(Float, default=92.4)
    quality_mod_acc = Column(Float, default=84.1)
    quality_poor_acc = Column(Float, default=62.8)
    avg_latency_ms = Column(Float, nullable=False)
    evaluated_at = Column(DateTime, default=get_utc_now)

class DatasetRecord(Base):
    __tablename__ = "datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    sample_count = Column(Integer, default=0)
    license = Column(String(100), default="Academic Non-Commercial / CC BY-NC 4.0")
    consent_verified = Column(Boolean, default=True)
    label_status = Column(String(50), default="Verified")  # Verified, Validating, Pending
    file_size_mb = Column(Float, default=120.0)
    created_at = Column(DateTime, default=get_utc_now)

class TrainingJob(Base):
    __tablename__ = "training_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_uuid = Column(String(36), default=generate_uuid, unique=True, index=True)
    job_name = Column(String(150), nullable=False)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    base_model = Column(String(100), default="YuNet + Age-GoogleNet")
    status = Column(String(50), default="ready")  # pending, validating, ready, training, completed, failed
    epochs = Column(Integer, default=10)
    batch_size = Column(Integer, default=32)
    learning_rate = Column(Float, default=0.001)
    validation_split = Column(Float, default=0.2)
    current_epoch = Column(Integer, default=0)
    current_loss = Column(Float, default=0.0)
    current_val_acc = Column(Float, default=0.0)
    logs = Column(Text, default="")
    created_at = Column(DateTime, default=get_utc_now)
    completed_at = Column(DateTime, nullable=True)

class RAGDocument(Base):
    __tablename__ = "rag_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    doc_id = Column(String(64), unique=True, index=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    category = Column(String(100), default="Documentation")
    content = Column(Text, nullable=False)
    chunk_count = Column(Integer, default=1)
    file_size_kb = Column(Float, default=10.0)
    author = Column(String(100), default="System Architect")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_utc_now)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    status = Column(String(50), default="SUCCESS")
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), default="127.0.0.1")
    created_at = Column(DateTime, default=get_utc_now)

class ApiUsage(Base):
    __tablename__ = "api_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String(200), nullable=False)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, default=200)
    latency_ms = Column(Float, default=0.0)
    user_email = Column(String(255), nullable=True)
    api_key_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

class SystemMetric(Base):
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    cpu_percent = Column(Float, default=0.0)
    memory_percent = Column(Float, default=0.0)
    active_sessions = Column(Integer, default=0)
    requests_per_min = Column(Integer, default=0)
    avg_latency_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=get_utc_now)

