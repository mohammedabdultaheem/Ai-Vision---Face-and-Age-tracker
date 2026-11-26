from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.sql_models import DatasetRecord, TrainingJob, AuditLog
from app.models.schemas import DatasetResponse, DatasetCreate, TrainingJobResponse, TrainingStartRequest
from app.api.v1.endpoints.auth import get_current_user
from app.models.sql_models import User
from app.services.training_service import training_service

router = APIRouter()

@router.get("/datasets", response_model=List[DatasetResponse])
def list_datasets(db: Session = Depends(get_db)):
    return db.query(DatasetRecord).order_by(DatasetRecord.created_at.desc()).all()

@router.post("/datasets", response_model=DatasetResponse)
def create_dataset(
    req: DatasetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.consent_verified:
        raise HTTPException(
            status_code=400,
            detail="Datasets without verified subject consent declarations cannot be registered."
        )

    ds = DatasetRecord(
        name=req.name,
        description=req.description,
        sample_count=req.sample_count,
        license=req.license,
        consent_verified=req.consent_verified,
        label_status="Verified",
        file_size_mb=round(req.sample_count * 0.08, 1)
    )
    db.add(ds)
    db.commit()
    db.refresh(ds)
    return ds

@router.get("/jobs", response_model=List[TrainingJobResponse])
def list_training_jobs(db: Session = Depends(get_db)):
    return db.query(TrainingJob).order_by(TrainingJob.created_at.desc()).all()

@router.post("/start", response_model=TrainingJobResponse)
def start_training(
    req: TrainingStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["Super Administrator", "Administrator", "Operator"]:
        raise HTTPException(status_code=403, detail="Insufficient role privileges to launch training jobs.")

    job = TrainingJob(
        job_name=req.job_name,
        dataset_id=req.dataset_id,
        base_model=req.base_model,
        status="pending",
        epochs=req.epochs,
        batch_size=req.batch_size,
        learning_rate=req.learning_rate,
        validation_split=req.validation_split,
        current_epoch=0,
        current_loss=0.0,
        current_val_acc=0.0,
        logs=f"Job '{req.job_name}' queued by {current_user.email}.\n"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Launch background worker
    training_service.start_training_job(job.id)

    audit = AuditLog(
        user_email=current_user.email,
        action="TRAINING_JOB_LAUNCHED",
        resource="TRAINING",
        status="SUCCESS",
        details=f"Job #{job.id} '{req.job_name}' started with {req.epochs} epochs"
    )
    db.add(audit)
    db.commit()

    return job

@router.get("/jobs/{job_id}/logs")
def get_job_logs(job_id: int, db: Session = Depends(get_db)):
    job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Training job not found.")
    return {
        "job_id": job.id,
        "status": job.status,
        "current_epoch": job.current_epoch,
        "total_epochs": job.epochs,
        "current_loss": job.current_loss,
        "current_val_acc": job.current_val_acc,
        "logs": job.logs
    }

