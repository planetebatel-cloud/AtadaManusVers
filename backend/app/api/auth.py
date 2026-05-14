"""
ATADA — Auth API Routes
POST /api/auth/guest        → create anonymous session
POST /api/auth/otp/send     → send OTP to phone (mock: console)
POST /api/auth/otp/verify   → verify OTP → JWT tokens
POST /api/auth/refresh       → refresh access token
GET  /api/auth/me            → current user info
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.domain.schemas import (
    OTPRequest, OTPVerify, TokenPair, RefreshRequest,
    GuestTokenResponse, UserOut,
)
from app.services.auth import (
    send_otp, verify_otp, create_access_token, create_refresh_token,
    decode_token, get_or_create_user, create_guest_session,
)
from app.api.deps import get_current_user
from app.domain.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/guest", response_model=GuestTokenResponse)
def create_guest(db: Session = Depends(get_db)):
    session = create_guest_session(db)
    return GuestTokenResponse(guest_token=session.token, message_limit=2)


@router.post("/otp/send")
def request_otp(body: OTPRequest, db: Session = Depends(get_db)):
    send_otp(body.phone, db)
    return {"message": "OTP sent", "phone": body.phone}


@router.post("/otp/verify", response_model=TokenPair)
def verify_otp_route(body: OTPVerify, db: Session = Depends(get_db)):
    if not verify_otp(body.phone, body.code, db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP code",
        )

    user = get_or_create_user(body.phone, db)
    access = create_access_token(user.id, user.role)
    refresh = create_refresh_token(user.id)

    return TokenPair(
        access_token=access,
        refresh_token=refresh,
        user_id=user.id,
    )


@router.post("/refresh", response_model=TokenPair)
def refresh_token(body: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    access = create_access_token(user.id, user.role)
    refresh = create_refresh_token(user.id)

    return TokenPair(
        access_token=access,
        refresh_token=refresh,
        user_id=user.id,
    )


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user
