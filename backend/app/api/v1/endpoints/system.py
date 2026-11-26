import os
import psutil
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.schemas import SystemHealthResponse

router = APIRouter()

@router.get("/health", response_model=SystemHealthResponse)
def get_system_health(db: Session = Depends(get_db)):
    cpu = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory().percent

    db_ok = True
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_ok = False

    models_ok = {
        "face_detector_yunet": os.path.exists(settings.FACE_MODEL_PATH),
        "age_estimator_googlenet": os.path.exists(settings.AGE_MODEL_PATH)
    }

    return {
        "status": "healthy" if db_ok and all(models_ok.values()) else "degraded",
        "version": settings.VERSION,
        "cpu_percent": float(cpu),
        "memory_percent": float(mem),
        "models_loaded": models_ok,
        "database_connected": db_ok,
        "rag_active": True,
        "privacy_mode": "Zero Biometric Retention (RAM Ephemeral)"
    }

@router.get("/metrics")
def get_system_metrics():
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage(".")
    return {
        "cpu_count": psutil.cpu_count(logical=True),
        "cpu_percent": psutil.cpu_percent(interval=None),
        "memory_total_gb": round(mem.total / (1024 ** 3), 2),
        "memory_used_gb": round(mem.used / (1024 ** 3), 2),
        "memory_percent": mem.percent,
        "disk_free_gb": round(disk.free / (1024 ** 3), 2),
        "disk_percent": disk.percent,
        "process_id": os.getpid()
    }

@router.get("/settings")
def get_system_settings():
    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "blur_threshold": settings.BLUR_THRESHOLD,
        "min_brightness": settings.MIN_BRIGHTNESS,
        "max_brightness": settings.MAX_BRIGHTNESS,
        "min_face_size": settings.MIN_FACE_SIZE,
        "store_raw_images": settings.STORE_RAW_IMAGES,
        "llm_provider": settings.LLM_PROVIDER,
        "api_rate_limit_rpm": 300,
        "webcam_default_fps": 5
    }

@router.put("/settings")
def update_system_settings(payload: dict):
    if "blur_threshold" in payload:
        settings.BLUR_THRESHOLD = float(payload["blur_threshold"])
    if "min_brightness" in payload:
        settings.MIN_BRIGHTNESS = float(payload["min_brightness"])
    if "max_brightness" in payload:
        settings.MAX_BRIGHTNESS = float(payload["max_brightness"])
    if "min_face_size" in payload:
        settings.MIN_FACE_SIZE = int(payload["min_face_size"])
    return {"message": "System settings updated successfully.", "settings": payload}

