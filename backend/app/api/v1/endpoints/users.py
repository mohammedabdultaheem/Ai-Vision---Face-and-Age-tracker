from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.sql_models import User, AuditLog
from app.models.schemas import UserResponse, UserUpdateRequest
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    req: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["Super Administrator", "Administrator"]:
        raise HTTPException(status_code=403, detail="Managing user accounts requires Administrator permissions.")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    if req.full_name is not None:
        target.full_name = req.full_name
    if req.role is not None:
        target.role = req.role
    if req.department is not None:
        target.department = req.department
    if req.is_active is not None:
        target.is_active = req.is_active

    audit = AuditLog(
        user_email=current_user.email,
        action="USER_MODIFIED",
        resource="USER_MANAGEMENT",
        status="SUCCESS",
        details=f"Modified user account {target.email} (Role: {target.role}, Active: {target.is_active})"
    )
    db.add(audit)
    db.commit()
    db.refresh(target)
    return target

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Super Administrator":
        raise HTTPException(status_code=403, detail="Deactivating accounts permanently requires Super Administrator role.")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    target.is_active = False
    audit = AuditLog(
        user_email=current_user.email,
        action="USER_DEACTIVATED",
        resource="USER_MANAGEMENT",
        status="SUCCESS",
        details=f"Deactivated account {target.email}"
    )
    db.add(audit)
    db.commit()
    return {"message": f"User {target.email} has been deactivated."}

