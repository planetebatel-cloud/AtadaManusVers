"""
ATADA — Pydantic Schemas (API contracts)
"""

from pydantic import BaseModel, Field
from datetime import datetime


# ─── Auth ───────────────────────────────────────────────────────────────────

class OTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20, examples=["+972501234567"])

class OTPVerify(BaseModel):
    phone: str
    code: str = Field(..., min_length=6, max_length=6)

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str

class RefreshRequest(BaseModel):
    refresh_token: str

class GuestTokenResponse(BaseModel):
    guest_token: str
    message_limit: int = 2


# ─── User ───────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    phone: str | None = None
    name: str | None = None
    email: str | None = None
    location: str | None = None
    lat: float | None = None
    lng: float | None = None
    skills: list[str] = []
    title: str | None = None
    about: str | None = None
    role: str = "worker"
    plan: str = "free"
    created_at: datetime | None = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    location: str | None = None
    lat: float | None = None
    lng: float | None = None
    skills: list[str] | None = None
    title: str | None = None
    about: str | None = None


# ─── Job ────────────────────────────────────────────────────────────────────

class JobOut(BaseModel):
    id: str
    title: str
    company: str
    location: str
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str = "ILS"
    salary_period: str = "hour"
    job_type: str = "full-time"
    tags: list[str] = []
    description: str | None = None
    image_url: str | None = None
    posted_at: datetime | None = None
    # computed at query time
    match_score: float | None = None
    distance: str | None = None
    travel_time: str | None = None
    reachable: bool = True
    # Commute breakdown (per-user, computed from home address)
    drive_minutes: int | None = None
    transit_minutes: int | None = None
    distance_km: float | None = None
    commute_source: str | None = None  # "google" | "haversine" | None

    class Config:
        from_attributes = True

class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    lat: float | None = None
    lng: float | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str = "ILS"
    salary_period: str = "hour"
    job_type: str = "full-time"
    tags: list[str] = []
    description: str | None = None
    image_url: str | None = None


# ─── Application ────────────────────────────────────────────────────────────

class ApplicationOut(BaseModel):
    id: str
    user_id: str
    job_id: str
    status: str
    match_score: float | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True

class ApplicationCreate(BaseModel):
    job_id: str

class ApplicationStatusUpdate(BaseModel):
    status: str  # applied | reviewed | interview | offer | rejected


# ─── Candidate ──────────────────────────────────────────────────────────────

class CandidateOut(BaseModel):
    id: str
    name: str
    title: str | None = None
    location: str | None = None
    skills: list[str] = []
    experience_years: int = 0
    about: str | None = None
    photo_url: str | None = None
    trust_score: float = 50.0
    is_newbie: bool = True

    class Config:
        from_attributes = True


# ─── Match ──────────────────────────────────────────────────────────────────

class MatchOut(BaseModel):
    id: str
    job_id: str
    score: float
    factors: dict = {}
    seen: bool = False
    action: str | None = None

    class Config:
        from_attributes = True

class SwipeAction(BaseModel):
    job_id: str
    action: str  # apply | skip


# ─── Chat ───────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    message: str

class ChatChunk(BaseModel):
    type: str = "text_chunk"  # text_chunk | candidates_data | done
    content: str = ""
    candidates: list[CandidateOut] | None = None


# ─── Payment ────────────────────────────────────────────────────────────────

class CreateCheckoutSession(BaseModel):
    plan: str  # pro | pro_plus | employer_pro
    success_url: str = "http://localhost:3000/profile?payment=success"
    cancel_url: str = "http://localhost:3000/profile?payment=cancel"

class CheckoutSessionOut(BaseModel):
    session_id: str
    url: str

class InvoiceOut(BaseModel):
    id: str
    amount: int
    currency: str
    description: str | None = None
    pdf_path: str | None = None
    status: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True
