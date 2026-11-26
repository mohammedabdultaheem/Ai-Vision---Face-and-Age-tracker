import os
import cv2
import numpy as np
from typing import List, Dict, Any, Tuple
from app.core.config import settings

class FaceDetectorService:
    def __init__(self, model_path: str = None):
        self.model_path = model_path or settings.FACE_MODEL_PATH
        self.detector = None
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"YuNet model file not found at: {self.model_path}")
        
        # Create FaceDetectorYN instance with default target dimension
        self.detector = cv2.FaceDetectorYN.create(
            self.model_path,
            "",
            (320, 320),
            score_threshold=0.35,
            nms_threshold=0.3,
            top_k=5000
        )

    def detect_faces(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detects faces in BGR image using an adaptive multi-pass strategy:
        1. Native resolution with balanced threshold (0.35)
        2. Native resolution with sensitive threshold (0.22) for low-light/angled faces
        3. Anchor-optimized 640px scale for large images (e.g. 1080p webcams)
        Returns list of dicts with:
          - 'bbox': [x, y, w, h]
          - 'confidence': float
          - 'landmarks': list of 5 (x, y) coordinates
        """
        if image is None or image.size == 0:
            return []

        h, w = image.shape[:2]
        scale_factor = 1.0

        # Pass 1: Detection at native resolution (score threshold 0.35)
        self.detector.setScoreThreshold(0.35)
        self.detector.setInputSize((w, h))
        _, raw_faces = self.detector.detect(image)

        # Pass 2: If no faces detected, try sensitive threshold (0.22)
        if raw_faces is None or len(raw_faces) == 0:
            self.detector.setScoreThreshold(0.22)
            _, raw_faces = self.detector.detect(image)

        # Pass 3: If still no faces and image is large (> 640px), downscale to 640px sweet-spot
        if (raw_faces is None or len(raw_faces) == 0) and (w > 640 or h > 640):
            scale_factor = 640.0 / max(w, h)
            nw, nh = int(w * scale_factor), int(h * scale_factor)
            resized = cv2.resize(image, (nw, nh))
            self.detector.setInputSize((nw, nh))
            self.detector.setScoreThreshold(0.25)
            _, raw_faces = self.detector.detect(resized)

        if raw_faces is None or len(raw_faces) == 0:
            return []

        results = []
        inv_scale = 1.0 / scale_factor
        for face in raw_faces:
            box = face[0:4]
            # Project coordinates back if Pass 3 was used
            x = int(box[0] * inv_scale)
            y = int(box[1] * inv_scale)
            bw = int(box[2] * inv_scale)
            bh = int(box[3] * inv_scale)
            
            # Clamp to image boundaries
            x = max(0, x)
            y = max(0, y)
            bw = min(w - x, bw)
            bh = min(h - y, bh)

            if bw <= 10 or bh <= 10:
                continue

            conf = float(face[-1])
            landmarks = []
            for i in range(4, 14, 2):
                lx = int(face[i] * inv_scale)
                ly = int(face[i+1] * inv_scale)
                landmarks.append([lx, ly])

            results.append({
                "bbox": [int(x), int(y), int(bw), int(bh)],
                "confidence": round(conf, 4),
                "landmarks": landmarks
            })

        return results

face_detector = FaceDetectorService()
