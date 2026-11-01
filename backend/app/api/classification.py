from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import ClassificationRequest, ClassificationResponse
from app.services.classification_service import ClassificationService
from app.models.models import AuditLog, User

router = APIRouter(prefix="/api/v1/classification", tags=["Classification"])


@router.post("/", response_model=ClassificationResponse)
async def classify_patient(
    request: ClassificationRequest,
    db: Session = Depends(get_db)
):
    """
    Process patient clinical data and return risk classification.
    Ensures response time < 5 seconds as per FR-05.
    """
    try:
        # 🔥 تحديث اسم المريض قبل المعالجة
        user = db.query(User).filter(
            User.national_id == request.patient.national_id,
            User.role == 'patient'
        ).first()

        if user:
            user.first_name = request.patient.first_name
            user.last_name = request.patient.last_name
            db.commit()

        # 🔥 تشغيل المودل
        service = ClassificationService()
        result = service.process_classification(
            db,
            request.patient,
            request.clinical_data
        )

        # ⏱️ تحقق من زمن الاستجابة
        if result["response_time_ms"] > 5000:
            raise HTTPException(
                status_code=500,
                detail="Response time exceeded 5 seconds threshold"
            )

        # 📦 تجهيز الرد
        response = ClassificationResponse(**result)

        risk = response.risk_classification
        patient = response.patient

        full_name = (
            f"{patient.first_name or ''} {patient.last_name or ''}".strip()
            or f"ID {patient.national_id}"
        )

        # 📝 Audit log
        audit = AuditLog(
            action=f"New Assessment — {full_name} → {risk.classification} ({risk.risk_color} Code)",
            user=str(patient.national_id or "kiosk"),
            status="Critical" if risk.risk_color == "Red" else "Info",
        )

        db.add(audit)
        db.commit()

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/case/{entry_id}")
async def get_case(entry_id: int, db: Session = Depends(get_db)):
    service = ClassificationService()
    result = service.get_case_details(db, entry_id)

    if not result:
        raise HTTPException(status_code=404, detail="Case not found")

    return result