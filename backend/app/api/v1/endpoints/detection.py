import base64
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.services.ai_pipeline import ai_pipeline
from app.models.sql_models import AnalysisSession, DetectionEvent
from app.models.schemas import DetectionAnalysisResponse

router = APIRouter()

@router.post("/analyze", response_model=DetectionAnalysisResponse)
async def analyze_frame(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Analyzes a camera frame or uploaded image:
    Detects faces, evaluates visual quality, estimates approximate age range, and returns results.
    Ephemeral in RAM: images are never written to disk or persistently stored.
    """
    image_bytes = None
    if file:
        image_bytes = await file.read()
    elif image_base64:
        try:
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            image_bytes = base64.b64decode(image_base64)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")
    else:
        raise HTTPException(status_code=400, detail="Either 'file' or 'image_base64' must be provided.")

    result = ai_pipeline.process_image(image_bytes, session_id=session_id)

    # Persist session metadata into DB
    try:
        session_record = db.query(AnalysisSession).filter(
            AnalysisSession.session_uuid == result["session_id"]
        ).first()

        if not session_record:
            session_record = AnalysisSession(
                session_uuid=result["session_id"],
                mode="webcam" if session_id else "image_upload",
                total_faces=result["total_faces"],
                avg_latency_ms=result["processing_latency_ms"],
                quality_summary=result["faces"][0]["image_quality"] if result["faces"] else "Good"
            )
            db.add(session_record)
            db.commit()
            db.refresh(session_record)
        else:
            session_record.total_faces += result["total_faces"]
            session_record.avg_latency_ms = (session_record.avg_latency_ms + result["processing_latency_ms"]) / 2.0
            db.commit()

        # Add detection events (metadata only, no biometric embeddings or face pixels)
        for face in result["faces"]:
            ev = DetectionEvent(
                session_id=session_record.id,
                face_temp_id=face["face_id"],
                age_range=face["age_range"],
                age_confidence=face["age_confidence"],
                gender=face.get("gender", "Undetermined"),
                gender_confidence=face.get("gender_confidence", 0.5),
                detection_confidence=face["detection_confidence"],
                image_quality=face["image_quality"],
                latency_ms=face["processing_time_ms"],
                bbox_json=json.dumps(face["bbox"]),
                warnings_json=json.dumps(face["quality_details"]["warnings"])
            )
            db.add(ev)
        db.commit()
    except Exception as e:
        print(f"[DB] Error saving session event: {e}")

    return result

@router.post("/image", response_model=DetectionAnalysisResponse)
async def analyze_image_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Dedicated image analysis endpoint with validation for JPG, JPEG, PNG, WebP.
    """
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{file.content_type}'. Supported: JPG, JPEG, PNG, WebP."
        )

    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum threshold (15MB).")

    result = ai_pipeline.process_image(content)

    # Persist analysis session
    try:
        session_record = AnalysisSession(
            session_uuid=result["session_id"],
            mode="image_upload",
            total_faces=result["total_faces"],
            avg_latency_ms=result["processing_latency_ms"],
            quality_summary=result["faces"][0]["image_quality"] if result["faces"] else "Good"
        )
        db.add(session_record)
        db.commit()
        db.refresh(session_record)

        for face in result["faces"]:
            ev = DetectionEvent(
                session_id=session_record.id,
                face_temp_id=face["face_id"],
                age_range=face["age_range"],
                age_confidence=face["age_confidence"],
                gender=face.get("gender", "Undetermined"),
                gender_confidence=face.get("gender_confidence", 0.5),
                detection_confidence=face["detection_confidence"],
                image_quality=face["image_quality"],
                latency_ms=face["processing_time_ms"],
                bbox_json=json.dumps(face["bbox"]),
                warnings_json=json.dumps(face["quality_details"]["warnings"])
            )
            db.add(ev)
        db.commit()
    except Exception as e:
        print(f"[DB] Error recording image upload session: {e}")

    return result

@router.get("/status")
def get_detection_status():
    return {
        "status": "ready",
        "detector": "OpenCV YuNet ONNX (640x640 FPN)",
        "estimator": "GoogleNet AgeNet ONNX (224x224 Inception)",
        "supported_formats": ["JPG", "JPEG", "PNG", "WebP"],
        "max_faces_per_frame": 15,
        "privacy_compliance": "Zero persistent image retention (RAM ephemeral)",
        "calibrated_age_brackets": 8
    }

@router.websocket("/stream")
async def websocket_stream_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for high-frequency live webcam streaming.
    Receives JSON or base64 frame string, runs AI pipeline, replies with detection JSON.
    """
    await websocket.accept()
    session_id = None
    try:
        while True:
            data = await websocket.receive_text()
            if not data:
                continue
            
            # Payload can be raw base64 or JSON {"image": "...", "session_id": "..."}
            image_b64 = data
            if data.startswith("{"):
                try:
                    parsed = json.loads(data)
                    image_b64 = parsed.get("image", "")
                    session_id = parsed.get("session_id", session_id)
                except Exception:
                    pass

            if "," in image_b64:
                image_b64 = image_b64.split(",")[1]

            try:
                frame_bytes = base64.b64decode(image_b64)
                result = ai_pipeline.process_image(frame_bytes, session_id=session_id)
                await websocket.send_text(json.dumps(result))
            except Exception as e:
                await websocket.send_text(json.dumps({
                    "error": str(e),
                    "total_faces": 0,
                    "faces": []
                }))
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WS] Disconnected: {e}")

