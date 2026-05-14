"""
ATADA — Auth Service
- Guest sessions (anonymous cookie → 2 message limit)
- SMS OTP (mock — prints code to console)
- JWT access + refresh tokens
- Progressive onboarding: guest → OTP verify → full user
"""

import random
import string
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.config import settings
from app.domain.models import User, GuestSession, OTPCode


# ─── OTP (mock SMS) ────────────────────────────────────────────────────────

def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=settings.OTP_LENGTH))


def send_otp(phone: str, db: Session) -> str:
    """Generate OTP and 'send' it. In dev mode, prints to console."""
    code = generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(seconds=settings.OTP_TTL_SECONDS)

    otp = OTPCode(phone=phone, code=code, expires_at=expires)
    db.add(otp)
    db.commit()

    # ───────────────────────────────────────────────────
    # MOCK: Print to console instead of sending real SMS
    # Replace with Twilio/MessageBird in production
    # ───────────────────────────────────────────────────
    print(f"\n{'='*50}")
    print(f"  ATADA OTP for {phone}: {code}")
    print(f"  Expires in {settings.OTP_TTL_SECONDS}s")
    print(f"{'='*50}\n")

    return code


def verify_otp(phone: str, code: str, db: Session) -> bool:
    """Verify OTP code for phone number."""
    otp = (
        db.query(OTPCode)
        .filter(
            OTPCode.phone == phone,
            OTPCode.code == code,
            OTPCode.used == False,
            OTPCode.expires_at > datetime.now(timezone.utc),
        )
        .order_by(OTPCode.created_at.desc())
        .first()
    )
    if not otp:
        return False
    otp.used = True
    db.commit()
    return True


# ─── JWT Tokens ─────────────────────────────────────────────────────────────

def create_access_token(user_id: str, role: str = "worker") -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TTL_MINUTES)
    payload = {
        "sub": user_id,
        "role": role,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TTL_DAYS)
    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def get_or_create_user(phone: str, db: Session) -> User:
    """Find user by phone or create new one."""
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        user = User(phone=phone)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


# ─── Guest Sessions ────────────────────────────────────────────────────────

def create_guest_session(db: Session) -> GuestSession:
    token = jwt.encode(
        {
            "type": "guest",
            "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        },
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    session = GuestSession(token=token)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def increment_guest_messages(session_id: str, db: Session) -> int:
    session = db.query(GuestSession).filter(GuestSession.id == session_id).first()
    if session:
        session.message_count += 1
        db.commit()
        return session.message_count
    return 0
