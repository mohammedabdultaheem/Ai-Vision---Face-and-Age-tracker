import time
import uuid
import cv2
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone

from app.services.face_detector import face_detector
from app.services.quality_assessor import quality_assessor
from app.services.age_estimator import age_estimator
from app.services.gender_estimator import gender_estimator

class FaceTrack:
    def __init__(self, track_id: int, bbox: List[int], age_probs: np.ndarray, gender_probs: np.ndarray):
        self.track_id = track_id
        self.bbox = bbox
        self.age_probs = np.array(age_probs, dtype=np.float32)
        self.gender_probs = np.array(gender_probs, dtype=np.float32)
        self.last_seen = time.time()

    def update(self, bbox: List[int], new_age_probs: np.ndarray, new_gender_probs: np.ndarray):
        self.bbox = bbox
        # Exponential Moving Average (EMA) to completely stabilize frame-to-frame predictions
        self.age_probs = 0.75 * self.age_probs + 0.25 * np.array(new_age_probs, dtype=np.float32)
        self.gender_probs = 0.80 * self.gender_probs + 0.20 * np.array(new_gender_probs, dtype=np.float32)
        self.last_seen = time.time()

class SessionTracker:
    def __init__(self):
        self.tracks: Dict[int, FaceTrack] = {}
        self.next_track_id = 1

    def match_and_update(
        self,
        bbox: List[int],
        new_age_probs: np.ndarray,
        new_gender_probs: np.ndarray
    ) -> Tuple[int, np.ndarray, np.ndarray]:
        now = time.time()
        # Clean up stale tracks (> 3.0s unseen)
        stale_ids = [tid for tid, trk in self.tracks.items() if now - trk.last_seen > 3.0]
        for tid in stale_ids:
            del self.tracks[tid]

        # Find best matching track via IoU
        best_tid = None
        best_iou = 0.35  # Overlap threshold for same face
        for tid, trk in self.tracks.items():
            iou = quality_assessor.compute_iou(bbox, trk.bbox)
            if iou > best_iou:
                best_iou = iou
                best_tid = tid

        if best_tid is not None:
            self.tracks[best_tid].update(bbox, new_age_probs, new_gender_probs)
            return best_tid, self.tracks[best_tid].age_probs, self.tracks[best_tid].gender_probs
        else:
            tid = self.next_track_id
            self.next_track_id += 1
            self.tracks[tid] = FaceTrack(tid, bbox, new_age_probs, new_gender_probs)
            return tid, self.tracks[tid].age_probs, self.tracks[tid].gender_probs

class AIPipelineService:
    def __init__(self):
        self.session_trackers: Dict[str, SessionTracker] = {}

    def _get_tracker(self, session_id: str) -> SessionTracker:
        if session_id not in self.session_trackers:
            self.session_trackers[session_id] = SessionTracker()
        return self.session_trackers[session_id]

    def process_image(
        self,
        image_bytes: bytes,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the modular computer vision pipeline:
        Input Image -> Validation -> Detection -> Contextual Cropping ->
        Quality Assessment -> Age Estimation & Gender Classification ->
        Temporal EMA Smoothing -> API response.
        """
        pipeline_start = time.perf_counter()
        session_uuid = session_id or str(uuid.uuid4())
        global_warnings: List[str] = []

        if not image_bytes or len(image_bytes) == 0:
            return {
                "session_id": session_uuid,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "total_faces": 0,
                "faces": [],
                "processing_latency_ms": 0.0,
                "fps_estimate": 0.0,
                "global_warnings": ["Received empty or corrupted image payload."]
            }

        # Ephemeral in-memory decode
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {
                "session_id": session_uuid,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "total_faces": 0,
                "faces": [],
                "processing_latency_ms": 0.0,
                "fps_estimate": 0.0,
                "global_warnings": ["Unsupported image format or corrupt byte stream."]
            }

        img_h, img_w = img.shape[:2]
        if img_w < 64 or img_h < 64:
            global_warnings.append(f"Image resolution very small ({img_w}x{img_h}px).")

        # 1. Face Detection Model
        det_start = time.perf_counter()
        raw_faces = face_detector.detect_faces(img)
        det_latency = (time.perf_counter() - det_start) * 1000.0

        if not raw_faces:
            total_time = (time.perf_counter() - pipeline_start) * 1000.0
            fps = 1000.0 / max(1.0, total_time)
            return {
                "session_id": session_uuid,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "total_faces": 0,
                "faces": [],
                "processing_latency_ms": round(total_time, 2),
                "fps_estimate": round(fps, 1),
                "global_warnings": global_warnings
            }

        # 2. Check for overlapping faces
        all_bboxes = [f["bbox"] for f in raw_faces]
        overlapping_indices = set(quality_assessor.check_overlapping_faces(all_bboxes))
        if overlapping_indices:
            global_warnings.append(f"{len(overlapping_indices)} overlapping faces detected. Verification recommended.")

        tracker = self._get_tracker(session_uuid) if session_id else None

        # 3. Face Localization, Cropping with Context Margin, Quality & Age/Gender
        analyzed_faces = []
        for idx, face_data in enumerate(raw_faces):
            face_start = time.perf_counter()
            bbox = face_data["bbox"]
            det_conf = face_data["confidence"]
            landmarks = face_data.get("landmarks", [])

            x, y, bw, bh = bbox

            # Add 20% contextual padding around bbox to prevent aggressive cropping
            # (which previously caused extreme prediction oscillations like 22-27 -> 35-45 -> 1-3)
            pad_w = int(bw * 0.20)
            pad_h = int(bh * 0.20)
            x1 = max(0, x - pad_w)
            y1 = max(0, y - pad_h)
            x2 = min(img_w, x + bw + pad_w)
            y2 = min(img_h, y + bh + pad_h)

            face_crop = img[y1:y2, x1:x2]
            if face_crop is None or face_crop.size == 0:
                continue

            # 4. Image Quality Assessment
            quality_info = quality_assessor.assess_face_quality(face_crop, bbox, (img_h, img_w))
            if idx in overlapping_indices:
                quality_info["warnings"].append("Significant bounding box overlap with another face.")
                if quality_info["score"] == "Good":
                    quality_info["score"] = "Moderate"

            # 5. Raw Age & Gender Model Inference
            raw_age_probs = age_estimator.get_raw_probabilities(face_crop)
            gender_raw = gender_estimator.estimate_gender(face_crop, quality_score=quality_info["score"])
            raw_gender_probs = np.array(gender_raw["probabilities"], dtype=np.float32)

            # 6. Temporal Consistency Smoothing across consecutive frames
            if tracker is not None:
                track_id, smoothed_age_probs, smoothed_gender_probs = tracker.match_and_update(
                    bbox, raw_age_probs, raw_gender_probs
                )
                face_id = f"Face #{track_id}"
            else:
                track_id = idx + 1
                face_id = f"Face #{idx + 1}"
                smoothed_age_probs = raw_age_probs
                smoothed_gender_probs = raw_gender_probs

            # Format Calibrated Age Prediction from Smoothed Distribution
            age_result = age_estimator.format_prediction(smoothed_age_probs, quality_score=quality_info["score"])

            # Formulate Gender Prediction from Smoothed Distribution
            m_prob, f_prob = float(smoothed_gender_probs[0]), float(smoothed_gender_probs[1])
            predicted_gender = "Female" if f_prob >= m_prob else "Male"
            gender_confidence = round(max(m_prob, f_prob), 3)

            face_latency = (time.perf_counter() - face_start) * 1000.0 + (det_latency / len(raw_faces))

            analyzed_faces.append({
                "face_id": face_id,
                "face_status": "Detected",
                "age_range": age_result["age_range"],
                "age_confidence": age_result["confidence"],
                "gender": predicted_gender,
                "gender_confidence": gender_confidence,
                "detection_confidence": det_conf,
                "image_quality": quality_info["score"],
                "quality_details": quality_info,
                "bbox": bbox,
                "landmarks": landmarks,
                "processing_time_ms": round(face_latency, 2)
            })

            del face_crop

        del img
        del nparr

        total_latency = (time.perf_counter() - pipeline_start) * 1000.0
        fps = 1000.0 / max(1.0, total_latency)

        return {
            "session_id": session_uuid,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_faces": len(analyzed_faces),
            "faces": analyzed_faces,
            "processing_latency_ms": round(total_latency, 2),
            "fps_estimate": round(fps, 1),
            "global_warnings": global_warnings,
            "privacy_notice": "Raw facial imagery processed ephemerally in RAM and purged immediately post-inference."
        }

ai_pipeline = AIPipelineService()
