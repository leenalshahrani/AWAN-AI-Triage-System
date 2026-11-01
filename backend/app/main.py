from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.classification import router as classification_router
from app.api.patients import router as patients_router
from app.api.analytics import router as analytics_router
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.symptoms import router as symptoms_router
from app.api.audit import router as audit_router
from app.api.cases import router as cases_router
from app.core.database import engine, Base
from app.models.models import ClinicalEntry, RiskClassification, SystemLog, User, Symptom, AuditLog  # noqa: F401 — registers all ORM models

# Don't create tables - they already exist
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Clinical Risk Classification API",
    description="Production-grade API for emergency department risk triage",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(classification_router)
app.include_router(patients_router)
app.include_router(analytics_router)
app.include_router(users_router)
app.include_router(symptoms_router)
app.include_router(audit_router)
app.include_router(cases_router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
