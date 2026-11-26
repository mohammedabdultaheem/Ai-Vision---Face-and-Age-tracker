import numpy as np
import cv2
from app.services.face_detector import face_detector
from app.services.quality_assessor import quality_assessor
from app.services.age_estimator import age_estimator
from app.services.ai_pipeline import ai_pipeline
from app.services.rag_engine import rag_engine

def test_face_detector_initialization():
    assert face_detector.detector is not None

def test_age_estimator_initialization():
    assert age_estimator.session is not None

def test_quality_assessor():
    dummy = np.zeros((100, 100, 3), dtype=np.uint8)
    res = quality_assessor.assess_face_quality(dummy, [10, 10, 80, 80], (200, 200))
    assert res["score"] in ["Good", "Moderate", "Poor"]
    assert "brightness" in res

def test_rag_engine_retrieval():
    res = rag_engine.query("What are the evaluation metrics for age estimation?")
    assert "query" in res
    assert "answer" in res
    assert len(res["citations"]) > 0

def test_ai_pipeline_empty():
    res = ai_pipeline.process_image(b"")
    assert res["total_faces"] == 0
    assert len(res["global_warnings"]) > 0
