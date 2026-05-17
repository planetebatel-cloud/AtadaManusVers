"""
ATADA — Auth API Routes
POST /api/auth/guest        → create anonymous session
POST /api/auth/otp/send     → send OTP to phone (mock: console)
POST /api/auth/otp/verify   → verify OTP → JWT tokens
GET  /api/auth/otp/peek     → DEMO ONLY: return latest OTP for whitelisted demo phones
POST /api/auth/refresh       → refresh access token
GET  /api/auth/me            → current user info
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
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
from app.domain.models import User, OTPCode
from app.services.rate_limit import limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Whitelist of phone numbers for which /otp/peek will return the latest code.
# This is how the public demo works without a real SMS provider.
DEMO_PHONES = {"+972501234567", "+972509876543"}


@router.post("/guest", response_model=GuestTokenResponse)
def create_guest(db: Session = Depends(get_db)):
    session = create_guest_session(db)
    return GuestTokenResponse(guest_token=session.token, message_limit=2)


# Two-tier rate limit on OTP send:
#   - 5/minute per source IP — stops a single attacker spamming SMS bills
#   - 3/hour per phone number — stops a botnet round-robining IPs
# Demo phones bypass the limit so the public demo never trips it.
@router.post("/otp/send")
@limiter.limit("5/minute")
def request_otp(request: Request, body: OTPRequest, db: Session = Depends(get_db)):
    if body.phone not in DEMO_PHONES:
        # Phone-scoped check (separate from IP-scoped @limiter above)
        from app.services.rate_limit import check_phone_quota
        check_phone_quota(body.phone)
    send_otp(body.phone, db)
    return {
        "message": "OTP sent",
        "phone": body.phone,
        "demo": body.phone in DEMO_PHONES,
    }


@router.get("/otp/peek")
def peek_otp(phone: str, db: Session = Depends(get_db)):
    """Return latest unused OTP for a whitelisted demo phone.

    Powers the public demo: there is no real SMS provider, so the frontend
    can auto-fetch the code for the two demo accounts. Returns 403 for any
    non-whitelisted phone — real users still go through the normal flow.
    """
    if phone not in DEMO_PHONES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Peek is only available for demo phone numbers",
        )
    otp = (
        db.query(OTPCode)
        .filter(
            OTPCode.phone == phone,
            OTPCode.used == False,
            OTPCode.expires_at > datetime.now(timezone.utc),
        )
        .order_by(OTPCode.created_at.desc())
        .first()
    )
    if not otp:
        raise HTTPException(status_code=404, detail="No active OTP for this phone")
    return {"code": otp.code, "expires_at": otp.expires_at.isoformat()}


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
