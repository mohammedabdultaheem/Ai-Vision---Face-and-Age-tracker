import cv2
import numpy as np
from typing import List, Dict, Any, Tuple

class ImageQualityAssessor:
    """
    Evaluates image and face crop quality based on:
    - Lighting (mean brightness)
    - Sharpness (Laplacian variance)
    - Resolution (pixel dimensions)
    - Border truncation (partially visible face)
    - Face overlap (IoU)
    """

    @staticmethod
    def compute_iou(boxA: List[int], boxB: List[int]) -> float:
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
        yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])

        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = boxA[2] * boxA[3]
        boxBArea = boxB[2] * boxB[3]
        iou = interArea / float(boxAArea + boxBArea - interArea + 1e-6)
        return float(iou)

    @staticmethod
    def assess_face_quality(
        face_crop: np.ndarray,
        bbox: List[int],
        img_shape: Tuple[int, int]
    ) -> Dict[str, Any]:
        warnings: List[str] = []
        if face_crop is None or face_crop.size == 0:
            return {
                "score": "Poor",
                "brightness": 0.0,
                "sharpness": 0.0,
                "resolution_w": 0,
                "resolution_h": 0,
                "warnings": ["Face crop is empty or unreadable"]
            }

        img_h, img_w = img_shape[:2]
        x, y, bw, bh = bbox

        # 1. Resolution Check
        if bw < 50 or bh < 50:
            warnings.append(f"Low face resolution ({bw}x{bh}px). Model precision may degrade.")

        # 2. Border Truncation Check
        touches_border = (x <= 2 or y <= 2 or (x + bw) >= (img_w - 2) or (y + bh) >= (img_h - 2))
        if touches_border:
            warnings.append("Face is partially truncated at the frame boundary.")

        # 3. Brightness Assessment (Grayscale mean)
        gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        if brightness < 45.0:
            warnings.append(f"Inadequate lighting: underexposed (brightness: {brightness:.1f}/255).")
        elif brightness > 220.0:
            warnings.append(f"Inadequate lighting: severe glare/overexposed (brightness: {brightness:.1f}/255).")

        # 4. Blur / Sharpness Assessment (Laplacian Variance)
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        if laplacian_var < 50.0:
            warnings.append(f"Severe motion blur detected (sharpness: {laplacian_var:.1f}).")
        elif laplacian_var < 90.0:
            warnings.append(f"Moderate blur detected (sharpness: {laplacian_var:.1f}).")

        # Aggregate Quality Score
        if len(warnings) >= 2 or brightness < 35.0 or laplacian_var < 40.0:
            score = "Poor"
        elif len(warnings) == 1:
            score = "Moderate"
        else:
            score = "Good"

        return {
            "score": score,
            "brightness": round(brightness, 1),
            "sharpness": round(laplacian_var, 1),
            "resolution_w": int(bw),
            "resolution_h": int(bh),
            "warnings": warnings
        }

    @classmethod
    def check_overlapping_faces(cls, bboxes: List[List[int]]) -> List[int]:
        """Returns indices of bounding boxes that significantly overlap (IoU > 0.35)."""
        overlapping_indices = set()
        n = len(bboxes)
        for i in range(n):
            for j in range(i + 1, n):
                if cls.compute_iou(bboxes[i], bboxes[j]) > 0.35:
                    overlapping_indices.add(i)
                    overlapping_indices.add(j)
        return list(overlapping_indices)

quality_assessor = ImageQualityAssessor()

