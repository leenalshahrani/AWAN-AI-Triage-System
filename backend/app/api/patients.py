from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import PatientUserResponse, PatientUserCreate
from app.repositories.repositories import PatientUserRepository
from app.models.models import User
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
import bcrypt

router = APIRouter(prefix="/api/v1/patients", tags=["Patients"])

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    contact_info: Optional[str] = None
    national_id: Optional[str] = None
    password: Optional[str] = None

@router.post("/", response_model=PatientUserResponse)
async def create_patient(patient: PatientUserCreate, db: Session = Depends(get_db)):
    return PatientUserRepository.create(db, patient)

@router.get("/by-national-id/{national_id}", response_model=PatientUserResponse)
async def get_patient_by_national_id(national_id: str, db: Session = Depends(get_db)):
    patient = PatientUserRepository.get_by_national_id(db, national_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/{patient_id}", response_model=PatientUserResponse)
async def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = PatientUserRepository.get_by_id(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/", response_model=List[PatientUserResponse])
async def list_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return PatientUserRepository.get_all(db, skip, limit)

@router.put("/{patient_id}", response_model=PatientUserResponse)
async def update_patient(patient_id: int, data: PatientUpdate, db: Session = Depends(get_db)):
    patient = db.query(User).filter(User.id == patient_id, User.role == 'patient').first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    update = data.model_dump(exclude_unset=True)
    if 'password' in update:
        raw = update.pop('password')
        patient.password_hash = bcrypt.hashpw(raw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    for key, value in update.items():
        setattr(patient, key, value)
    db.commit()
    db.refresh(patient)
    return patient

@router.delete("/{patient_id}")
async def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(User).filter(User.id == patient_id, User.role == 'patient').first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    return {"message": "Patient deleted successfully"}
