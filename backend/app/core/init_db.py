from datetime import datetime, timezone
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.sql_models import (
    User, ModelRegistry, DatasetRecord, RAGDocument, AuditLog, AnalysisSession, DetectionEvent
)

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Seed Users if table is empty
        if db.query(User).count() == 0:
            users_to_seed = [
                User(
                    email="superadmin@aivision.io",
                    full_name="Dr. Elena Vance (Super Admin)",
                    hashed_password=get_password_hash("SuperAdmin2026!"),
                    role="Super Administrator",
                    department="Executive AI Governance",
                    is_active=True
                ),
                User(
                    email="admin@aivision.io",
                    full_name="Marcus Reed (Admin)",
                    hashed_password=get_password_hash("Admin2026!"),
                    role="Administrator",
                    department="Computer Vision Engineering",
                    is_active=True
                ),
                User(
                    email="operator@aivision.io",
                    full_name="Sarah Chen (Operator)",
                    hashed_password=get_password_hash("Operator2026!"),
                    role="Operator",
                    department="Vision Operations",
                    is_active=True
                ),
                User(
                    email="analyst@aivision.io",
                    full_name="James Wilson (Analyst)",
                    hashed_password=get_password_hash("Analyst2026!"),
                    role="Read-only Analyst",
                    department="Compliance & Audit",
                    is_active=True
                )
            ]
            db.add_all(users_to_seed)
            db.commit()

        # 2. Seed Model Registry if empty
        if db.query(ModelRegistry).count() == 0:
            models_to_seed = [
                ModelRegistry(
                    model_name="OpenCV YuNet Face Detector",
                    model_type="face_detection",
                    architecture="Lightweight FPN Single-Stage CNN",
                    version="v2023.03",
                    model_size="232 KB",
                    dataset_provenance="WIDER Face Benchmark",
                    license="Apache-2.0",
                    status="active",
                    mae=0.0,
                    rmse=0.0,
                    range_accuracy=94.5,
                    latency_ms=7.2,
                    description="High-speed dynamic-dimension neural face detector with 5 landmark points."
                ),
                ModelRegistry(
                    model_name="GoogleNet AgeNet Inception",
                    model_type="age_estimation",
                    architecture="Inception Multi-Branch Deep CNN (ONNX)",
                    version="v1.2.0",
                    model_size="23.9 MB",
                    dataset_provenance="Adience & UTKFace Benchmarks",
                    license="Apache-2.0",
                    status="active",
                    mae=3.18,
                    rmse=4.05,
                    range_accuracy=87.6,
                    latency_ms=14.5,
                    description="Production 8-class calibrated age distribution estimator with continuous expectation calibration."
                ),
                ModelRegistry(
                    model_name="MobileNet-V3 Age Regressor",
                    model_type="age_estimation",
                    architecture="MobileNetV3-Large ONNX",
                    version="v1.0.0-rc2",
                    model_size="15.4 MB",
                    dataset_provenance="FairFace Validated Subset",
                    license="MIT",
                    status="staging",
                    mae=3.42,
                    rmse=4.31,
                    range_accuracy=84.9,
                    latency_ms=11.2,
                    description="Candidate lightweight edge inference model undergoing staging evaluations."
                ),
                ModelRegistry(
                    model_name="GoogleNet Gender Classifier",
                    model_type="gender_classification",
                    architecture="Inception Multi-Branch Deep CNN (ONNX)",
                    version="v1.0.0",
                    model_size="23.9 MB",
                    dataset_provenance="Adience Demographic Benchmark",
                    license="Apache-2.0",
                    status="active",
                    mae=0.0,
                    rmse=0.0,
                    range_accuracy=92.4,
                    latency_ms=13.8,
                    description="Binary biological male/female classification network with softmax probability calibration."
                )
            ]
            db.add_all(models_to_seed)
            db.commit()

        # 3. Seed Datasets if empty
        if db.query(DatasetRecord).count() == 0:
            datasets_to_seed = [
                DatasetRecord(
                    name="UTKFace Research Benchmark",
                    description="Large-scale facial image dataset with verified age annotations spanning 0 to 116 years.",
                    sample_count=23708,
                    license="Academic Non-Commercial (CC BY-NC 4.0)",
                    consent_verified=True,
                    label_status="Verified",
                    file_size_mb=115.4
                ),
                DatasetRecord(
                    name="FairFace Diverse Benchmark",
                    description="Balanced dataset designed to emphasize demographic fairness and reduce cohort bias.",
                    sample_count=10000,
                    license="CC BY 4.0",
                    consent_verified=True,
                    label_status="Verified",
                    file_size_mb=85.2
                ),
                DatasetRecord(
                    name="Adience Age Benchmark",
                    description="Unconstrained real-world facial images captured in natural conditions.",
                    sample_count=26580,
                    license="Open Science Research License",
                    consent_verified=True,
                    label_status="Verified",
                    file_size_mb=140.0
                )
            ]
            db.add_all(datasets_to_seed)
            db.commit()

        # 4. Seed initial Audit Log
        if db.query(AuditLog).count() == 0:
            audit = AuditLog(
                user_email="system@aivision.io",
                action="SYSTEM_INITIALIZATION",
                resource="BOOTSTRAP",
                status="SUCCESS",
                details="AI VISION platform initialized with zero-retention privacy enforcement."
            )
            db.add(audit)
            db.commit()

    except Exception as e:
        print(f"[InitDB] Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

