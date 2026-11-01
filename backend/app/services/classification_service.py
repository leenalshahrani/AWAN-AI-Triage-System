from sqlalchemy.orm import Session
from app.models.models import RiskClassification
from app.repositories.repositories import (
    PatientUserRepository, ClinicalEntryRepository,
    RiskClassificationRepository, SystemLogRepository
)
from app.schemas.schemas import PatientUserCreate, ClinicalEntryBase, ClinicalEntryCreate
from app.ml.classifier import RiskClassifierService
import time
from typing import Optional

class ClassificationService:
    def __init__(self):
        self.ml_service = RiskClassifierService()

    def process_classification(
        self,
        db: Session,
        patient_data: PatientUserCreate,
        clinical_data: ClinicalEntryBase
    ):
        start_time = time.time()

        # Create or reuse patient user
        patient = PatientUserRepository.create(db, patient_data)

        # Create clinical entry
        clinical_entry_data = ClinicalEntryCreate(
            patient_id=patient.id,
            **clinical_data.model_dump()
        )
        clinical_entry = ClinicalEntryRepository.create(db, clinical_entry_data)

        # ML prediction
        classification, risk_color, confidence_score, used_fallback = self.ml_service.predict(
            clinical_data.model_dump(),
            patient_data.model_dump()
        )

        # Store classification result
        risk_classification = RiskClassificationRepository.create(
            db,
            clinical_entry.entry_id,
            classification,
            risk_color,
            confidence_score
        )

        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)

        # Log performance
        SystemLogRepository.create(
            db,
            clinical_entry.entry_id,
            "Classification",
            response_time_ms
        )

        return {
            "patient": patient,
            "clinical_entry": clinical_entry,
            "risk_classification": risk_classification,
            "response_time_ms": response_time_ms,
            "used_fallback": used_fallback,
        }

    def get_case_details(self, db: Session, entry_id: int):
        clinical_entry = ClinicalEntryRepository.get_by_id(db, entry_id)
        if not clinical_entry:
            return None

        patient = PatientUserRepository.get_by_id(db, clinical_entry.patient_id)
        classification = db.query(RiskClassification).filter(
            RiskClassification.entry_id == entry_id
        ).first()

        return {
            "patient": patient,
            "clinical_entry": clinical_entry,
            "risk_classification": classification
        }
