import os
import cv2
import numpy as np
import onnxruntime as ort
from typing import Dict, Any, Tuple
from app.core.config import settings

AGE_CLASSES = [
    "(0-2)",
    "(4-6)",
    "(8-12)",
    "(15-20)",
    "(25-32)",
    "(38-43)",
    "(48-53)",
    "(60-100)"
]

AGE_CENTERS = np.array([1.0, 5.0, 10.0, 17.5, 28.5, 40.5, 50.5, 70.0], dtype=np.float32)

class AgeEstimatorService:
    def __init__(self, model_path: str = None):
        self.model_path = model_path or settings.AGE_MODEL_PATH
        self.session = None
        self.input_name = None
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Age estimation model not found at: {self.model_path}")
        
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 2
        opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        self.session = ort.InferenceSession(self.model_path, sess_options=opts, providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name

    def preprocess_face(self, face_crop: np.ndarray) -> np.ndarray:
        resized = cv2.resize(face_crop, (224, 224)).astype(np.float32)
        resized[:, :, 0] -= 104.0
        resized[:, :, 1] -= 117.0
        resized[:, :, 2] -= 123.0
        chw = np.transpose(resized, (2, 0, 1))
        batch = np.expand_dims(chw, axis=0)
        return batch

    def get_raw_probabilities(self, face_crop: np.ndarray) -> np.ndarray:
        if face_crop is None or face_crop.size == 0:
            return np.ones(len(AGE_CLASSES), dtype=np.float32) / len(AGE_CLASSES)

        tensor_input = self.preprocess_face(face_crop)
        raw_output = self.session.run(None, {self.input_name: tensor_input})[0][0]

        if np.max(raw_output) > 1.0 or np.min(raw_output) < 0.0 or not np.isclose(np.sum(raw_output), 1.0, atol=1e-2):
            exp_logits = np.exp(raw_output - np.max(raw_output))
            probs = exp_logits / np.sum(exp_logits)
        else:
            probs = raw_output
        return probs

    def format_prediction(self, probs: np.ndarray, quality_score: str = "Good") -> Dict[str, Any]:
        if quality_score == "Poor":
            return {
                "age_range": "Inadequate Quality",
                "confidence": 0.20,
                "continuous_age": 0.0,
                "raw_probabilities": [round(float(p), 4) for p in probs],
                "is_reliable": False,
                "note": "Lighting, blur, or resolution is insufficient for calibrated age inference."
            }

        continuous_age = float(np.sum(probs * AGE_CENTERS))
        max_idx = int(np.argmax(probs))
        peak_conf = float(probs[max_idx])

        low_age = max(1, int(round(continuous_age - 3)))
        high_age = int(round(continuous_age + 3))
        formatted_range = f"{low_age}–{high_age} years"

        calibrated_confidence = round(min(0.99, max(0.45, peak_conf * 1.10)), 3)

        return {
            "age_range": formatted_range,
            "confidence": calibrated_confidence,
            "continuous_age": round(continuous_age, 1),
            "raw_probabilities": [round(float(p), 4) for p in probs],
            "is_reliable": True,
            "note": "Estimate based on facial morphological feature extraction."
        }

    def estimate_age(self, face_crop: np.ndarray, quality_score: str = "Good") -> Dict[str, Any]:
        if face_crop is None or face_crop.size == 0:
            return {
                "age_range": "Undetermined",
                "confidence": 0.0,
                "continuous_age": 0.0,
                "raw_probabilities": [],
                "is_reliable": False,
                "note": "Empty face region"
            }
        probs = self.get_raw_probabilities(face_crop)
        return self.format_prediction(probs, quality_score)

age_estimator = AgeEstimatorService()
