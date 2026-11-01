from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Symptom as SymptomModel
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/v1/symptoms", tags=["Symptoms"])

class SymptomCreate(BaseModel):
    symptom: str
    category: str
    severity: str
    description: Optional[str] = None
    status: bool = True

class SymptomUpdate(BaseModel):
    symptom: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    status: Optional[bool] = None

class SymptomResponse(BaseModel):
    id: int
    symptom: str
    category: str
    severity: str
    description: Optional[str]
    status: bool

    class Config:
        from_attributes = True

@router.post("/", response_model=SymptomResponse)
async def create_symptom(symptom: SymptomCreate, db: Session = Depends(get_db)):
    db_symptom = SymptomModel(**symptom.model_dump())
    db.add(db_symptom)
    db.commit()
    db.refresh(db_symptom)
    return db_symptom

@router.get("/", response_model=List[SymptomResponse])
async def list_symptoms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(SymptomModel).offset(skip).limit(limit).all()

@router.get("/{symptom_id}", response_model=SymptomResponse)
async def get_symptom(symptom_id: int, db: Session = Depends(get_db)):
    symptom = db.query(SymptomModel).filter(SymptomModel.id == symptom_id).first()
    if not symptom:
        raise HTTPException(status_code=404, detail="Symptom not found")
    return symptom

@router.put("/{symptom_id}", response_model=SymptomResponse)
async def update_symptom(symptom_id: int, symptom_update: SymptomUpdate, db: Session = Depends(get_db)):
    symptom = db.query(SymptomModel).filter(SymptomModel.id == symptom_id).first()
    if not symptom:
        raise HTTPException(status_code=404, detail="Symptom not found")

    for key, value in symptom_update.model_dump(exclude_unset=True).items():
        setattr(symptom, key, value)

    db.commit()
    db.refresh(symptom)
    return symptom

@router.delete("/{symptom_id}")
async def delete_symptom(symptom_id: int, db: Session = Depends(get_db)):
    symptom = db.query(SymptomModel).filter(SymptomModel.id == symptom_id).first()
    if not symptom:
        raise HTTPException(status_code=404, detail="Symptom not found")

    db.delete(symptom)
    db.commit()
    return {"message": "Symptom deleted successfully"}
