from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    detection,
    models,
    training,
    rag,
    analytics,
    reports,
    security,
    users,
    system,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(detection.router, prefix="/detection", tags=["Face Detection & Age Estimation"])
api_router.include_router(models.router, prefix="/models", tags=["AI Model Management"])
api_router.include_router(training.router, prefix="/training", tags=["Training & Datasets"])
api_router.include_router(rag.router, prefix="/rag", tags=["RAG Knowledge Assistant"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Exports"])
api_router.include_router(security.router, prefix="/security", tags=["Security & Compliance"])
api_router.include_router(users.router, prefix="/users", tags=["User Management"])
api_router.include_router(system.router, prefix="/system", tags=["System & Health"])

