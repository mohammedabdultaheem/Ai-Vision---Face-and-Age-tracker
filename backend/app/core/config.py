import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI VISION - Enterprise Face Detection & Age Estimation"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "ai-vision-enterprise-super-secret-key-change-in-prod-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'aivision.db'}")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Paths
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = BASE_DIR / "app" / "data"
    MODELS_DIR: Path = BASE_DIR / "app" / "data" / "models"
    RAG_DOCS_DIR: Path = BASE_DIR / "app" / "data" / "rag_docs"
    
    # Model Files
    FACE_MODEL_PATH: str = str(MODELS_DIR / "face_detection_yunet.onnx")
    AGE_MODEL_PATH: str = str(MODELS_DIR / "age_googlenet.onnx")
    
    # Quality & Privacy
    MIN_FACE_SIZE: int = 40
    BLUR_THRESHOLD: float = 75.0
    MIN_BRIGHTNESS: float = 40.0
    MAX_BRIGHTNESS: float = 220.0
    STORE_RAW_IMAGES: bool = False  # Strict privacy: zero persistent face storage
    
    # AI & RAG Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")  # gemini, openai, local
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()

