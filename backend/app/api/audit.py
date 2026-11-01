from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import AuditLog as AuditLogModel
from pydantic import BaseModel
from datetime import datetime
from typing import List

router = APIRouter(prefix="/api/v1/audit", tags=["Audit"])

class AuditLogCreate(BaseModel):
    action: str
    user: str
    status: str

class AuditLogResponse(BaseModel):
    id: int
    action: str
    user: str
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=AuditLogResponse)
async def create_audit_log(log: AuditLogCreate, db: Session = Depends(get_db)):
    db_log = AuditLogModel(**log.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/", response_model=List[AuditLogResponse])
async def list_audit_logs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(AuditLogModel).order_by(AuditLogModel.timestamp.desc()).offset(skip).limit(limit).all()
