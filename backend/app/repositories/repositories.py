import bcrypt
from sqlalchemy.orm import Session
from app.models.models import User, ClinicalEntry, RiskClassification, SystemLog
from app.schemas.schemas import PatientUserCreate, ClinicalEntryCreate
from typing import Optional

class PatientUserRepository:
    @staticmethod
    def create(db: Session, patient: PatientUserCreate) -> User:
        # Reuse existing patient user if same national_id already registered
        if patient.national_id:
            existing = db.query(User).filter(
                User.national_id == patient.national_id,
                User.role == 'patient'
            ).first()
            if existing:
                return existing

        full_name = f"{patient.first_name} {patient.last_name}".strip()

        # Default password = national_id (hashed), or None if no national_id
        password_hash = None
        if patient.national_id:
            password_hash = bcrypt.hashpw(
                patient.national_id.encode('utf-8'), bcrypt.gensalt()
            ).decode('utf-8')

        db_user = User(
            role='patient',
            full_name=full_name,
            password_hash=password_hash,
            national_id=patient.national_id,
            first_name=patient.first_name,
            last_name=patient.last_name,
            date_of_birth=patient.date_of_birth,
            gender=patient.gender,
            contact_info=patient.contact_info,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id, User.role == 'patient').first()

    @staticmethod
    def get_by_national_id(db: Session, national_id: str) -> Optional[User]:
        return db.query(User).filter(
            User.national_id == national_id,
            User.role == 'patient'
        ).first()

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(User).filter(User.role == 'patient').offset(skip).limit(limit).all()


class ClinicalEntryRepository:
    @staticmethod
    def create(db: Session, entry: ClinicalEntryCreate) -> ClinicalEntry:
        db_entry = ClinicalEntry(**entry.model_dump(), validated=True)
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry

    @staticmethod
    def get_by_id(db: Session, entry_id: int) -> Optional[ClinicalEntry]:
        return db.query(ClinicalEntry).filter(ClinicalEntry.entry_id == entry_id).first()


class RiskClassificationRepository:
    @staticmethod
    def create(db: Session, entry_id: int, classification: str, risk_color: str, confidence_score: float) -> RiskClassification:
        db_classification = RiskClassification(
            entry_id=entry_id,
            classification=classification,
            risk_color=risk_color,
            confidence_score=confidence_score
        )
        db.add(db_classification)
        db.commit()
        db.refresh(db_classification)
        return db_classification


class SystemLogRepository:
    @staticmethod
    def create(db: Session, entry_id: Optional[int], action: str, response_time_ms: int) -> SystemLog:
        db_log = SystemLog(
            entry_id=entry_id,
            action=action,
            response_time_ms=response_time_ms
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log
