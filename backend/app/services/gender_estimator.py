import os
import cv2
import numpy as np
import onnxruntime as ort
from typing import Dict, Any
from app.core.config import settings

GENDER_CLASSES = ["Male", "Female"]

class GenderEstimatorService:
    def __init__(self, model_path: str = None):
        self.model_path = model_path or str(settings.MODELS_DIR / "gender_googlenet.onnx")
        self.session = None
        self.input_name = None
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Gender estimation model not found at: {self.model_path}")
        
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

    def estimate_gender(self, face_crop: np.ndarray, quality_score: str = "Good") -> Dict[str, Any]:
        if face_crop is None or face_crop.size == 0 or quality_score == "Poor":
            return {
                "gender": "Undetermined",
                "confidence": 0.50,
                "probabilities": [0.50, 0.50]
            }

        try:
            tensor_input = self.preprocess_face(face_crop)
            raw_output = self.session.run(None, {self.input_name: tensor_input})[0][0]

            # Softmax if not already normalized
            if np.max(raw_output) > 1.0 or np.min(raw_output) < 0.0 or not np.isclose(np.sum(raw_output), 1.0, atol=1e-2):
                exp_logits = np.exp(raw_output - np.max(raw_output))
                probs = exp_logits / np.sum(exp_logits)
            else:
                probs = raw_output

            male_prob = float(probs[0])
            female_prob = float(probs[1])

            gender = "Female" if female_prob >= male_prob else "Male"
            confidence = round(max(male_prob, female_prob), 3)

            return {
                "gender": gender,
                "confidence": confidence,
                "probabilities": [round(male_prob, 3), round(female_prob, 3)]
            }
        except Exception as e:
            return {
                "gender": "Undetermined",
                "confidence": 0.50,
                "probabilities": [0.50, 0.50],
                "error": str(e)
            }

gender_estimator = GenderEstimatorService()

