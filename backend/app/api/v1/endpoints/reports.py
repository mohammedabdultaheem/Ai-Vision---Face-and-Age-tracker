import csv
import io
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.sql_models import AnalysisSession, DetectionEvent

router = APIRouter()

@router.get("/")
def list_reports(db: Session = Depends(get_db)):
    sessions = db.query(AnalysisSession).order_by(AnalysisSession.created_at.desc()).limit(20).all()
    reports = []
    for s in sessions:
        reports.append({
            "report_id": f"REP-{s.id:05d}",
            "session_uuid": s.session_uuid,
            "mode": s.mode,
            "total_faces": s.total_faces,
            "avg_latency_ms": round(s.avg_latency_ms, 2),
            "quality_summary": s.quality_summary,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return reports

@router.get("/export")
def export_aggregate_csv(db: Session = Depends(get_db)):
    """Exports aggregate detection metrics as CSV (strictly zero individual face images or embeddings)."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Event ID", "Session ID", "Face Temp ID", "Estimated Age Range",
        "Age Confidence", "Detection Confidence", "Quality", "Latency (ms)", "Timestamp"
    ])

    events = db.query(DetectionEvent).order_by(DetectionEvent.created_at.desc()).limit(500).all()
    for ev in events:
        writer.writerow([
            ev.id,
            ev.session_id,
            ev.face_temp_id,
            ev.age_range,
            ev.age_confidence,
            ev.detection_confidence,
            ev.image_quality,
            ev.latency_ms,
            ev.created_at.isoformat() if ev.created_at else ""
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=ai_vision_aggregate_report_{int(datetime.now().timestamp())}.csv"}
    )

