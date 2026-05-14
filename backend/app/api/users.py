"""
ATADA — Users API Routes
GET    /api/users/me         → current user profile
PATCH  /api/users/me         → update profile
GET    /api/users/me/applications → user's applications
GET    /api/candidates        → list candidates (employer view)
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.domain.models import User, Application, Job, Candidate, Match
from app.domain.schemas import UserOut, UserUpdate, ApplicationOut, CandidateOut
from app.api.deps import get_current_user
from app.services.matching import apply_newbie_mixing
from app.services.geocode import geocode_address

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_profile(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_profile(
    body: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    update_data = body.model_dump(exclude_unset=True)
    location_changed = (
        "location" in update_data
        and update_data["location"] != user.location
    )

    for field, value in update_data.items():
        setattr(user, field, value)

    # Auto-geocode on address change unless the client supplied lat/lng itself
    if location_changed and "lat" not in update_data and "lng" not in update_data:
        coords = geocode_address(user.location)
        if coords:
            user.lat, user.lng = coords
        else:
            user.lat, user.lng = None, None

        # Invalidate cached matches so distance factor recomputes next feed fetch
        db.query(Match).filter(Match.user_id == user.id).delete()

    db.commit()
    db.refresh(user)
    return user


@router.get("/me/applications", response_model=list[ApplicationOut])
def get_my_applications(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    apps = (
        db.query(Application)
        .filter(Application.user_id == user.id)
        .order_by(Application.created_at.desc())
        .all()
    )
    return apps


@router.get("/candidates", response_model=list[CandidateOut])
def list_candidates(
    skills: str | None = Query(None, description="Comma-separated skills filter"),
    location: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Candidate).filter(Candidate.is_active == True)

    if location:
        query = query.filter(Candidate.location.ilike(f"%{location}%"))

    candidates = query.order_by(Candidate.trust_score.desc()).limit(limit).all()

    # Apply skill filter in Python (JSON field)
    if skills:
        required = {s.strip().lower() for s in skills.split(",")}
        candidates = [
            c for c in candidates
            if required & {s.lower() for s in (c.skills or [])}
        ]

    # Newbie mixing rule
    candidates = apply_newbie_mixing(candidates, count=3)

    return [CandidateOut.model_validate(c) for c in candidates]
