from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from typing import Optional, Literal

class PatientUserCreate(BaseModel):
    national_id: Optional[str] = Field(None, max_length=20)
    first_name: str = Field('', max_length=100)
    last_name: str = Field('', max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[Literal['M', 'F', 'O']] = None
    contact_info: Optional[str] = Field(None, max_length=255)

class PatientUserResponse(BaseModel):
    id: int
    national_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    contact_info: Optional[str] = None

    class Config:
        from_attributes = True

class ClinicalEntryBase(BaseModel):
    pain_type: str = Field(..., min_length=1, max_length=50)
    pain_location: str = Field(..., min_length=1, max_length=50)
    numbness: bool
    other_symptoms: Optional[str] = None
    duration: Optional[str] = Field(None, max_length=50)
    severity: Optional[str] = Field(None, max_length=20)
    height_cm:        Optional[float] = None
    weight_kg:        Optional[float] = None
    hypertension:     Optional[int]   = None
    heart_disease_hx: Optional[int]   = None
    ever_married:     Optional[str]   = None
    work_type:        Optional[str]   = None
    residence_type:   Optional[str]   = None
    smoking_status:   Optional[str]   = None
    chest_pain_type:  Optional[int]   = None
    exercise_angina:  Optional[int]   = None

class ClinicalEntryCreate(ClinicalEntryBase):
    patient_id: int

class ClinicalEntryResponse(ClinicalEntryBase):
    entry_id: int
    patient_id: int
    entry_datetime: datetime
    validated: bool

    class Config:
        from_attributes = True

class RiskClassificationResponse(BaseModel):
    classification_id: int
    entry_id: int
    classification: str
    risk_color: Literal['Red', 'Green']
    confidence_score: float
    processed_datetime: datetime

    class Config:
        from_attributes = True

class ClassificationRequest(BaseModel):
    patient: PatientUserCreate
    clinical_data: ClinicalEntryBase

class ClassificationResponse(BaseModel):
    patient: PatientUserResponse
    clinical_entry: ClinicalEntryResponse
    risk_classification: RiskClassificationResponse
    response_time_ms: int
    used_fallback: bool = False
