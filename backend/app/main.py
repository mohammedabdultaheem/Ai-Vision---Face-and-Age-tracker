import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.init_db import init_db
from app.api.v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite/PostgreSQL schema and seed default enterprise entities
    print("[AI VISION] Bootstrapping enterprise database schema...")
    init_db()
    print("[AI VISION] Pretrained models loaded and ready for ephemeral inference.")
    yield
    print("[AI VISION] Server shutting down cleanly.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "AI VISION is an enterprise-grade AI computer vision platform for real-time webcam face detection, "
        "image-upload analysis, approximate age estimation using pretrained ONNX models, RAG-assisted documentation, "
        "and AI model governance. Built with zero-retention privacy by design."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register master API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_check": f"{settings.API_V1_STR}/system/health",
        "api_v1": settings.API_V1_STR,
        "privacy_posture": "Strict Zero Persistent Face Storage (RAM Ephemeral)"
    }

