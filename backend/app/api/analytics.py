from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.core.database import get_db
from app.models.models import RiskClassification, SystemLog, ClinicalEntry
from datetime import datetime, timedelta
from typing import Dict

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])

@router.get("/dashboard")
async def get_dashboard_stats(db: Session = Depends(get_db)) -> Dict:
    total_cases = db.query(ClinicalEntry).count()
    high_risk = db.query(RiskClassification).filter(RiskClassification.risk_color == 'Red').count()
    low_risk = db.query(RiskClassification).filter(RiskClassification.risk_color == 'Green').count()
    
    avg_response_time = float(db.query(func.avg(SystemLog.response_time_ms)).scalar() or 0)
    
    classification_breakdown = db.query(
        RiskClassification.classification,
        func.count(RiskClassification.classification_id)
    ).group_by(RiskClassification.classification).all()
    
    # Daily cases for last 7 days
    from datetime import datetime, timedelta
    daily_cases = []
    for i in range(6, -1, -1):
        day = datetime.now() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0)
        day_end = day.replace(hour=23, minute=59, second=59)
        
        critical = db.query(RiskClassification).join(ClinicalEntry).filter(
            ClinicalEntry.entry_datetime.between(day_start, day_end),
            RiskClassification.risk_color == 'Red'
        ).count()
        
        safe = db.query(RiskClassification).join(ClinicalEntry).filter(
            ClinicalEntry.entry_datetime.between(day_start, day_end),
            RiskClassification.risk_color == 'Green'
        ).count()
        
        daily_cases.append({
            "day": day.strftime("%a"),
            "critical": critical,
            "safe": safe
        })
    
    return {
        "total_cases": total_cases,
        "high_risk_count": high_risk,
        "low_risk_count": low_risk,
        "avg_response_time_ms": round(avg_response_time, 2),
        "classification_breakdown": {k: v for k, v in classification_breakdown},
        "daily_cases": daily_cases
    }

@router.get("/performance")
async def get_performance_metrics(days: int = 7, db: Session = Depends(get_db)) -> Dict:
    since = datetime.now() - timedelta(days=days)
    
    logs = db.query(SystemLog).filter(SystemLog.log_datetime >= since).all()
    
    response_times = [log.response_time_ms for log in logs]
    
    return {
        "total_requests": len(response_times),
        "avg_response_time_ms": round(sum(response_times) / len(response_times), 2) if response_times else 0,
        "max_response_time_ms": max(response_times) if response_times else 0,
        "min_response_time_ms": min(response_times) if response_times else 0,
        "within_threshold": sum(1 for t in response_times if t <= 5000)
    }

@router.get("/recent-cases")
async def get_recent_cases(limit: int = 10, db: Session = Depends(get_db)):
    cases = db.query(ClinicalEntry).order_by(desc(ClinicalEntry.entry_datetime)).limit(limit).all()
    
    result = []
    for case in cases:
        classification = db.query(RiskClassification).filter(
            RiskClassification.entry_id == case.entry_id
        ).first()
        
        result.append({
            "entry_id": case.entry_id,
            "patient_id": case.patient_id,
            "entry_datetime": case.entry_datetime,
            "pain_type": case.pain_type,
            "pain_location": case.pain_location,
            "classification": classification.classification if classification else None,
            "risk_color": classification.risk_color if classification else None
        })
    
    return result
