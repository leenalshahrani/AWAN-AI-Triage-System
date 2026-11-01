from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
from datetime import datetime, timedelta
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.database import get_db
from app.models.models import User, AuditLog

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


class Token(BaseModel):
    access_token: str
    token_type: str


class UserMe(BaseModel):
    username: str
    role: str
    full_name: str
    email: str


class PatientLoginRequest(BaseModel):
    national_id: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


def create_access_token(data: dict):
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


# ── Staff / Admin / Physician login ──────────────────────────────────────────

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username, User.is_active == True).first()
    if not user or not user.password_hash or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token({
        "sub": user.username,
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email,
    })

    audit = AuditLog(action="User Login", user=user.username, status="Info")
    db.add(audit)
    db.commit()

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserMe)
async def get_current_user(token: str = Depends(oauth2_scheme)):
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        full_name: str = payload.get("full_name", "")
        email: str = payload.get("email", "")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return UserMe(username=username, role=role, full_name=full_name, email=email)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ── Patient login ─────────────────────────────────────────────────────────────
@router.post("/patient-login", response_model=Token)
async def patient_login(body: PatientLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.national_id == body.national_id,
        User.role == 'patient',
        User.is_active == True
    ).first()

    # 🔥 Auto-create patient if not exists
    if not user:
        user = User(
            role='patient',
            national_id=body.national_id,
            first_name="Patient",
            last_name="User",
            password_hash=None,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # First-time login (no password set yet)
    if user.password_hash is None:
        if body.password != user.national_id:
            raise HTTPException(status_code=401, detail="Invalid national ID or password")

        user.password_hash = bcrypt.hashpw(
            body.password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        db.commit()

    # Normal login
    elif not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid national ID or password")

    # Generate token
    full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
    access_token = create_access_token({
        "sub": user.national_id,
        "role": "patient",
        "full_name": full_name,
        "national_id": user.national_id,
        "user_id": user.id,
    })

    # Audit log
    audit = AuditLog(
        action=f"Patient Login — {full_name} (ID: {user.national_id})",
        user=user.national_id,
        status="Info",
    )
    db.add(audit)
    db.commit()

    return {"access_token": access_token, "token_type": "bearer"}


# ── Patient change password ───────────────────────────────────────────────────

@router.patch("/patient/change-password")
async def change_patient_password(
    body: ChangePasswordRequest,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        national_id: str = payload.get("sub")
        role: str = payload.get("role")
        if role != "patient" or not national_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(
        User.national_id == national_id,
        User.role == 'patient'
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Verify current password
    if user.password_hash is None:
        if body.old_password != user.national_id:
            raise HTTPException(status_code=400, detail="Incorrect current password")
    elif not verify_password(body.old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    user.password_hash = bcrypt.hashpw(
        body.new_password.encode('utf-8'), bcrypt.gensalt()
    ).decode('utf-8')

    audit = AuditLog(
        action=f"Patient Password Changed (ID: {national_id})",
        user=national_id,
        status="Warning",
    )
    db.add(audit)
    db.commit()

    return {"message": "Password changed successfully"}
