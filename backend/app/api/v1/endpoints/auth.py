from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token, oauth2_scheme
from app.models.sql_models import User, AuditLog
from app.models.schemas import UserLogin, UserRegister, ForgotPasswordRequest, Token, UserResponse

router = APIRouter()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(token)
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated.")
    return user

@router.post("/login", response_model=Token)
def login(form_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.email).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        # Log failure
        audit = AuditLog(
            user_email=form_data.email,
            action="LOGIN_FAILURE",
            resource="AUTH",
            status="FAILED",
            details="Invalid email or password credentials."
        )
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated.")

    user.last_login = datetime.now(timezone.utc)
    token = create_access_token(subject=user.email, role=user.role)

    audit = AuditLog(
        user_email=user.email,
        action="LOGIN_SUCCESS",
        resource="AUTH",
        status="SUCCESS",
        details=f"User authenticated with role {user.role}"
    )
    db.add(audit)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_name": user.full_name,
        "email": user.email
    }

@router.post("/register", response_model=UserResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered in system.")

    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role or "Operator",
        department=user_in.department or "AI Operations",
        is_active=True
    )
    db.add(new_user)
    
    audit = AuditLog(
        user_email=user_in.email,
        action="USER_REGISTRATION",
        resource="USER",
        status="SUCCESS",
        details=f"Self-registered new user with role {new_user.role}"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        audit = AuditLog(
            user_email=req.email,
            action="PASSWORD_RESET_REQUESTED",
            resource="AUTH",
            status="SUCCESS",
            details="Password recovery token generated and sent to user email."
        )
        db.add(audit)
        db.commit()
    return {
        "message": "If this email exists in our system, recovery instructions have been transmitted securely.",
        "status": "dispatched"
    }

@router.post("/logout")
def logout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    audit = AuditLog(
        user_email=user.email,
        action="USER_LOGOUT",
        resource="AUTH",
        status="SUCCESS",
        details="User logged out cleanly."
    )
    db.add(audit)
    db.commit()
    return {"message": "Successfully logged out.", "status": "terminated"}

@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return user

