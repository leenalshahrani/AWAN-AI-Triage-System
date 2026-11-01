from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.models import ClinicalEntry, RiskClassification, User, AuditLog
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/api/v1/cases", tags=["Cases"])

class CaseResponse(BaseModel):
    entry_id: int
    patient_id: int
    patient_name: str
    national_id: Optional[str]
    entry_datetime: datetime
    pain_type: str
    pain_location: str
    numbness: bool
    other_symptoms: Optional[str]
    duration: Optional[str]
    severity: Optional[str]
    height_cm: Optional[float]
    weight_kg: Optional[float]
    hypertension: Optional[bool]
    heart_disease_hx: Optional[bool]
    ever_married: Optional[str]
    work_type: Optional[str]
    residence_type: Optional[str]
    smoking_status: Optional[str]
    chest_pain_type: Optional[int]
    exercise_angina: Optional[bool]
    classification: Optional[str]
    risk_color: Optional[str]
    confidence_score: Optional[float]
    validated: bool
    patient_notified: bool

    class Config:
        from_attributes = True

@router.get("/", response_model=List[CaseResponse])
async def list_cases(
    skip: int = 0,
    limit: int = 100,
    risk_color: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    national_id: Optional[str] = Query(None),
    notified_only: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ClinicalEntry).join(User, ClinicalEntry.patient_id == User.id).outerjoin(RiskClassification)

    if national_id:
        query = query.filter(User.national_id == national_id)

    if notified_only:
        query = query.filter(ClinicalEntry.patient_notified == True)

    if risk_color:
        query = query.filter(RiskClassification.risk_color == risk_color)

    if start_date:
        query = query.filter(ClinicalEntry.entry_datetime >= start_date)

    if end_date:
        query = query.filter(ClinicalEntry.entry_datetime <= end_date)

    cases = query.order_by(desc(ClinicalEntry.entry_datetime)).offset(skip).limit(limit).all()

    result = []
    for case in cases:
        classification = db.query(RiskClassification).filter(
            RiskClassification.entry_id == case.entry_id
        ).first()

        name_parts = [case.patient.first_name, case.patient.last_name]
        patient_name = ' '.join(p for p in name_parts if p).strip() or f"Patient #{case.patient.national_id or case.patient_id}"
        result.append({
            "entry_id": case.entry_id,
            "patient_id": case.patient_id,
            "patient_name": patient_name,
            "national_id": case.patient.national_id,
            "entry_datetime": case.entry_datetime,
            "pain_type": case.pain_type,
            "pain_location": case.pain_location,
            "numbness": case.numbness,
            "other_symptoms": case.other_symptoms,
            "duration": case.duration,
            "severity": case.severity,
            "height_cm": float(case.height_cm) if case.height_cm is not None else None,
            "weight_kg": float(case.weight_kg) if case.weight_kg is not None else None,
            "hypertension": case.hypertension,
            "heart_disease_hx": case.heart_disease_hx,
            "ever_married": case.ever_married,
            "work_type": case.work_type,
            "residence_type": case.residence_type,
            "smoking_status": case.smoking_status,
            "chest_pain_type": case.chest_pain_type,
            "exercise_angina": case.exercise_angina,
            "validated": case.validated,
            "classification": classification.classification if classification else None,
            "risk_color": classification.risk_color if classification else None,
            "confidence_score": float(classification.confidence_score) if classification else None,
            "patient_notified": case.patient_notified or False,
        })

    return result

@router.get("/{entry_id}")
async def get_case_detail(entry_id: int, db: Session = Depends(get_db)):
    case = db.query(ClinicalEntry).filter(ClinicalEntry.entry_id == entry_id).first()
    if not case:
        return {"error": "Case not found"}

    patient = db.query(User).filter(User.id == case.patient_id).first()
    classification = db.query(RiskClassification).filter(
        RiskClassification.entry_id == entry_id
    ).first()

    return {
        "patient": {
            "id": patient.id,
            "national_id": patient.national_id,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "date_of_birth": patient.date_of_birth,
            "gender": patient.gender,
            "contact_info": patient.contact_info
        },
        "clinical_entry": {
            "entry_id": case.entry_id,
            "entry_datetime": case.entry_datetime,
            "pain_type": case.pain_type,
            "pain_location": case.pain_location,
            "numbness": case.numbness,
            "other_symptoms": case.other_symptoms,
            "duration": case.duration,
            "severity": case.severity,
            "height_cm": float(case.height_cm) if case.height_cm is not None else None,
            "weight_kg": float(case.weight_kg) if case.weight_kg is not None else None,
            "hypertension": case.hypertension,
            "heart_disease_hx": case.heart_disease_hx,
            "ever_married": case.ever_married,
            "work_type": case.work_type,
            "residence_type": case.residence_type,
            "smoking_status": case.smoking_status,
            "chest_pain_type": case.chest_pain_type,
            "exercise_angina": case.exercise_angina,
            "validated": case.validated
        },
        "risk_classification": {
            "classification": classification.classification if classification else None,
            "risk_color": classification.risk_color if classification else None,
            "confidence_score": float(classification.confidence_score) if classification else None,
            "processed_datetime": classification.processed_datetime if classification else None
        } if classification else None
    }

@router.patch("/{entry_id}/validate")
async def validate_case(entry_id: int, db: Session = Depends(get_db)):
    case = db.query(ClinicalEntry).filter(ClinicalEntry.entry_id == entry_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case.validated = True
    audit = AuditLog(action=f"Case #{entry_id} marked as seen", user="physician", status="Info")
    db.add(audit)
    db.commit()
    return {"entry_id": entry_id, "validated": True}


class NotifyRequest(BaseModel):
    doctor_username: str


@router.post("/{entry_id}/notify")
async def notify_patient(entry_id: int, body: NotifyRequest, db: Session = Depends(get_db)):
    case = db.query(ClinicalEntry).filter(ClinicalEntry.entry_id == entry_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    classification = db.query(RiskClassification).filter(
        RiskClassification.entry_id == entry_id
    ).first()

    result_summary = (
        f"{classification.classification} — {classification.risk_color} Code"
        if classification
        else "result pending"
    )

    case.patient_notified = True
    audit = AuditLog(
        action=f"Patient for Case #{entry_id} notified of result by {body.doctor_username}: {result_summary}",
        user=body.doctor_username,
        status="Info",
    )
    db.add(audit)
    db.commit()
    return {"entry_id": entry_id, "notified": True}


class OverrideRequest(BaseModel):
    target_color: str  # "Red" or "Green"
    justification: str
    doctor_username: str


@router.patch("/{entry_id}/override")
async def override_case(entry_id: int, body: OverrideRequest, db: Session = Depends(get_db)):
    if body.target_color not in ("Red", "Green"):
        raise HTTPException(status_code=400, detail="target_color must be 'Red' or 'Green'")
    if not body.justification.strip():
        raise HTTPException(status_code=400, detail="Justification is required")

    classification = db.query(RiskClassification).filter(
        RiskClassification.entry_id == entry_id
    ).first()
    if not classification:
        raise HTTPException(status_code=404, detail="Classification not found for this case")

    previous_color = classification.risk_color
    classification.risk_color = body.target_color

    if body.target_color == "Red" and previous_color == "Green":
        classification.classification = "Doctor Override — Escalated to Red"
        audit_status = "Critical"
        audit_action = (
            f"Case #{entry_id} escalated GREEN→RED by {body.doctor_username}. "
            f"Justification: {body.justification}"
        )
    else:
        classification.classification = "Doctor Override — Downgraded to Green"
        audit_status = "Warning"
        audit_action = (
            f"Case #{entry_id} downgraded RED→GREEN by {body.doctor_username}. "
            f"Justification: {body.justification}"
        )

    audit = AuditLog(action=audit_action, user=body.doctor_username, status=audit_status)
    db.add(audit)
    db.commit()

    return {
        "entry_id": entry_id,
        "previous_color": previous_color,
        "new_color": body.target_color,
        "classification": classification.classification,
    }
