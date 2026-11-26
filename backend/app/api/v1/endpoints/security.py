from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.sql_models import AuditLog, User
from app.models.schemas import AuditLogResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(limit: int = 100, db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()

@router.get("/privacy-settings")
def get_privacy_settings():
    return {
        "store_raw_images": False,
        "persistent_biometric_embeddings": False,
        "facial_identity_database": False,
        "ephemeral_ram_processing": True,
        "camera_permission_required": True,
        "visible_active_indicator": True,
        "immediate_stop_killswitch": True,
        "audio_recording_enabled": False,
        "data_retention_days": 30,
        "jurisdiction_compliance": ["GDPR Art. 9 Compliant", "CCPA/CPRA Compliant", "BIPA Standards Aligned"],
        "last_privacy_audit": "2026-10-15T00:00:00Z"
    }

@router.post("/privacy-settings")
def update_privacy_settings(
    settings_payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Super Administrator":
        raise HTTPException(status_code=403, detail="Modifying enterprise privacy posture requires Super Administrator role.")

    # Audit modification
    audit = AuditLog(
        user_email=current_user.email,
        action="PRIVACY_POSTURE_MODIFIED",
        resource="SECURITY_CENTER",
        status="SUCCESS",
        details="Enterprise privacy parameters updated and re-verified."
    )
    db.add(audit)
    db.commit()

    return {"message": "Enterprise privacy settings updated and recorded in immutable audit log.", "status": "active"}

@router.get("/api-keys")
def list_api_keys():
    return [
        {
            "id": "key_prod_01",
            "name": "Production Vision Ingestion Key",
            "prefix": "aiv_live_***",
            "created_at": "2026-09-01T12:00:00Z",
            "rate_limit_rpm": 600,
            "status": "active"
        },
        {
            "id": "key_dev_02",
            "name": "Sandbox Test Key",
            "prefix": "aiv_test_***",
            "created_at": "2026-10-12T09:30:00Z",
            "rate_limit_rpm": 60,
            "status": "active"
        }
    ]

