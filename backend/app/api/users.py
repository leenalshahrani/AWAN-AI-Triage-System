from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User as UserModel, AuditLog
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import bcrypt

router = APIRouter(prefix="/api/v1/users", tags=["Users"])

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(UserModel).filter(
        (UserModel.username == user.username) | (UserModel.email == user.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    password_hash = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    db_user = UserModel(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        password_hash=password_hash,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    db.add(AuditLog(action=f"User Created — {user.username} ({user.role})", user="admin", status="Info"))
    db.commit()
    return db_user

@router.get("/", response_model=List[UserResponse])
async def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(UserModel).filter(UserModel.role != 'patient').offset(skip).limit(limit).all()

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_update.model_dump(exclude_unset=True)
    if 'password' in update_data:
        raw = update_data.pop('password')
        user.password_hash = bcrypt.hashpw(raw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    db.add(AuditLog(action=f"User Updated — {user.username or user.id}", user="admin", status="Info"))
    db.commit()
    return user

@router.delete("/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    username = user.username or str(user.id)
    db.delete(user)
    db.commit()
    db.add(AuditLog(action=f"User Deleted — {username}", user="admin", status="Warning"))
    db.commit()
    return {"message": "User deleted successfully"}
