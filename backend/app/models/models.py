from sqlalchemy import Column, Integer, String, Date, Boolean, Text, TIMESTAMP, DECIMAL, BigInteger, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=True)
    email = Column(String(255), unique=True, nullable=True)
    full_name = Column(String(200), nullable=True)
    role = Column(String(50), nullable=False)
    password_hash = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    # Patient-specific fields (populated for role='patient')
    national_id = Column(String(20), nullable=True, index=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(1), nullable=True)
    contact_info = Column(String(255), nullable=True)

class ClinicalEntry(Base):
    __tablename__ = "clinical_entries"

    entry_id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    entry_datetime = Column(TIMESTAMP, server_default=func.current_timestamp())
    pain_type = Column(String(50))
    pain_location = Column(String(50))
    numbness = Column(Boolean)
    other_symptoms = Column(Text)
    duration = Column(String(50), nullable=True)
    severity = Column(String(20), nullable=True)
    height_cm        = Column(DECIMAL(5, 1), nullable=True)
    weight_kg        = Column(DECIMAL(5, 1), nullable=True)
    hypertension     = Column(Boolean, nullable=True)
    heart_disease_hx = Column(Boolean, nullable=True)
    ever_married     = Column(String(10), nullable=True)
    work_type        = Column(String(50), nullable=True)
    residence_type   = Column(String(20), nullable=True)
    smoking_status   = Column(String(50), nullable=True)
    chest_pain_type  = Column(Integer, nullable=True)
    exercise_angina  = Column(Boolean, nullable=True)
    validated = Column(Boolean, default=False)
    patient_notified = Column(Boolean, default=False)
    patient = relationship("User")

class RiskClassification(Base):
    __tablename__ = "risk_classifications"

    classification_id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    entry_id = Column(Integer, ForeignKey("clinical_entries.entry_id"), nullable=False)
    classification = Column(String(50), nullable=False)
    risk_color = Column(String(10), nullable=False)
    confidence_score = Column(DECIMAL(5, 2))
    processed_datetime = Column(TIMESTAMP, server_default=func.current_timestamp())
    clinical_entry = relationship("ClinicalEntry")

class SystemLog(Base):
    __tablename__ = "system_logs"

    log_id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    entry_id = Column(Integer)
    action = Column(String(100), nullable=False)
    response_time_ms = Column(Integer, nullable=False)
    log_datetime = Column(TIMESTAMP, server_default=func.current_timestamp())

class Symptom(Base):
    __tablename__ = "symptoms"
    id = Column(Integer, primary_key=True, autoincrement=True)
    symptom = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    description = Column(Text)
    status = Column(Boolean, default=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(200), nullable=False)
    user = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)
    timestamp = Column(TIMESTAMP, server_default=func.current_timestamp())
