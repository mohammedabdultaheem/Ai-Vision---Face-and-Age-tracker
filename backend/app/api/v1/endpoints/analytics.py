from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.analytics_service import analytics_service
from app.models.schemas import AnalyticsOverview, PerformanceMetrics

router = APIRouter()

@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(days: int = 30, db: Session = Depends(get_db)):
    return analytics_service.get_overview(db, days=days)

@router.get("/performance", response_model=PerformanceMetrics)
def get_performance_metrics(days: int = 7, db: Session = Depends(get_db)):
    return analytics_service.get_performance(db, days=days)

