"""
ATADA — SQLAlchemy Domain Models
Tables: users, guest_sessions, otp_codes, jobs, candidates,
        applications, matches, employer_plans, invoices
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, JSON, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.db.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ─── Users ──────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    phone = Column(String(20), unique=True, nullable=True)
    name = Column(String(120), nullable=True)
    email = Column(String(200), nullable=True)
    location = Column(String(200), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    skills = Column(JSON, default=list)         # ["React", "TypeScript"]
    title = Column(String(200), nullable=True)  # "Frontend Developer"
    about = Column(Text, nullable=True)
    role = Column(String(20), default="worker")  # worker | employer
    plan = Column(String(20), default="free")    # free | pro | pro_plus
    stripe_customer_id = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    applications = relationship("Application", back_populates="user")
    resumes = relationship("Resume", back_populates="user")


class GuestSession(Base):
    __tablename__ = "guest_sessions"

    id = Column(String, primary_key=True, default=_uuid)
    token = Column(String(500), unique=True, nullable=False)
    message_count = Column(Integer, default=0)   # max 2 before auth wall
    created_at = Column(DateTime, default=_now)


class OTPCode(Base):
    __tablename__ = "otp_codes"

    id = Column(String, primary_key=True, default=_uuid)
    phone = Column(String(20), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=_now)


# ─── Jobs ───────────────────────────────────────────────────────────────────

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=_uuid)
    employer_id = Column(String, ForeignKey("users.id"), nullable=True)
    title = Column(String(200), nullable=False)
    company = Column(String(200), nullable=False)
    location = Column(String(200), nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_currency = Column(String(10), default="ILS")
    salary_period = Column(String(20), default="hour")   # hour | month | year
    job_type = Column(String(20), default="full-time")    # full-time | part-time | contract | gig
    tags = Column(JSON, default=list)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    image_url = Column(String(500), nullable=True)
    source = Column(String(50), default="manual")         # manual | parser | employer
    posted_at = Column(DateTime, default=_now)
    created_at = Column(DateTime, default=_now)

    applications = relationship("Application", back_populates="job")


# ─── Candidates (worker profiles visible to employers) ──────────────────────

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    name = Column(String(120), nullable=False)
    title = Column(String(200), nullable=True)
    location = Column(String(200), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    skills = Column(JSON, default=list)
    experience_years = Column(Integer, default=0)
    about = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    trust_score = Column(Float, default=50.0)    # 0-100, event-driven
    is_newbie = Column(Boolean, default=True)     # for newbie mixing rule
    source = Column(String(50), default="manual") # manual | parser
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_now)


# ─── Applications ───────────────────────────────────────────────────────────

class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    status = Column(String(20), default="applied")  # applied | reviewed | interview | offer | rejected
    match_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")


# ─── Match (pre-computed for feed) ──────────────────────────────────────────

class Match(Base):
    __tablename__ = "matches"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    score = Column(Float, nullable=False)          # 0-100
    factors = Column(JSON, default=dict)            # {"skills": 40, "location": 30, ...}
    seen = Column(Boolean, default=False)
    action = Column(String(10), nullable=True)      # apply | skip | null
    created_at = Column(DateTime, default=_now)


# ─── Resumes ────────────────────────────────────────────────────────────────

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    data = Column(JSON, nullable=False)
    pdf_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    user = relationship("User", back_populates="resumes")


# ─── Invoices ───────────────────────────────────────────────────────────────

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    stripe_invoice_id = Column(String(100), nullable=True)
    amount = Column(Integer, nullable=False)         # in agorot (ILS cents)
    currency = Column(String(10), default="ILS")
    description = Column(String(500), nullable=True)
    pdf_path = Column(String(500), nullable=True)
    status = Column(String(20), default="paid")
    created_at = Column(DateTime, default=_now)
