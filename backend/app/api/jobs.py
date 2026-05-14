"""
ATADA — Jobs API Routes
GET  /api/jobs            → list jobs (with match scores for auth users)
GET  /api/jobs/:id        → job detail
POST /api/jobs            → create job (employer)
GET  /api/jobs/feed       → personalized feed for worker (match-sorted)
POST /api/jobs/swipe      → record apply/skip action
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.domain.models import Job, User, Match, Application
from app.domain.schemas import JobOut, JobCreate, SwipeAction, ApplicationOut
from app.api.deps import get_current_user, get_optional_user
from app.services.matching import compute_matches_for_user
from app.services.commute import compute_commute, format_minutes
from app.services.geocode import geocode_address

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _job_to_out(job: Job, match: Match | None = None, user: User | None = None) -> JobOut:
    dist_str = None
    travel_str = None
    reachable = True
    drive_min: int | None = None
    transit_min: int | None = None
    dist_km: float | None = None
    source: str | None = None

    # Ensure job has coords — lazy-geocode on first read so legacy rows work too
    if (job.lat is None or job.lng is None) and job.location:
        coords = geocode_address(job.location)
        if coords:
            job.lat, job.lng = coords

    if user and user.lat is not None and user.lng is not None:
        commute = compute_commute(user.lat, user.lng, job.lat, job.lng)
        if commute:
            drive_min = commute["drive_minutes"]
            transit_min = commute["transit_minutes"]
            dist_km = commute["distance_km"]
            source = commute["source"]

    # Backwards-compatible fields for the existing UI
    if dist_km is None and match and match.factors:
        dist_km = match.factors.get("distance_km")

    if dist_km is not None:
        dist_str = f"{dist_km} km"
        reachable = dist_km < 50
    if drive_min is not None:
        travel_str = format_minutes(drive_min)
    elif dist_km is not None:
        # No user coords but we have a haversine from matching — best-effort
        travel_str = format_minutes(int(dist_km * 2))

    return JobOut(
        id=job.id,
        title=job.title,
        company=job.company,
        location=job.location,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=job.salary_currency,
        salary_period=job.salary_period,
        job_type=job.job_type,
        tags=job.tags or [],
        description=job.description,
        image_url=job.image_url,
        posted_at=job.posted_at,
        match_score=match.score if match else None,
        distance=dist_str,
        travel_time=travel_str,
        reachable=reachable,
        drive_minutes=drive_min,
        transit_minutes=transit_min,
        distance_km=dist_km,
        commute_source=source,
    )


@router.get("", response_model=list[JobOut])
def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    jobs = db.query(Job).filter(Job.is_active == True).offset(skip).limit(limit).all()
    result = []
    for job in jobs:
        match = None
        if user:
            match = db.query(Match).filter(Match.user_id == user.id, Match.job_id == job.id).first()
        result.append(_job_to_out(job, match, user))
    if user:
        db.commit()  # persist any lazy-geocoded job coords
    return result


@router.get("/feed", response_model=list[JobOut])
def get_feed(
    limit: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    matches = compute_matches_for_user(user, db, limit=limit)
    result = []
    for match in matches:
        if match.action is not None:  # already swiped
            continue
        job = db.query(Job).filter(Job.id == match.job_id).first()
        if job:
            result.append(_job_to_out(job, match, user))
    db.commit()  # persist any lazy-geocoded job coords
    return result


@router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: str,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    match = None
    if user:
        match = db.query(Match).filter(Match.user_id == user.id, Match.job_id == job.id).first()
    out = _job_to_out(job, match, user)
    if user:
        db.commit()  # persist any lazy-geocoded job coords
    return out


@router.post("", response_model=JobOut)
def create_job(
    body: JobCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lat, lng = body.lat, body.lng
    if (lat is None or lng is None) and body.location:
        coords = geocode_address(body.location)
        if coords:
            lat, lng = coords

    job = Job(
        employer_id=user.id,
        title=body.title,
        company=body.company,
        location=body.location,
        lat=lat,
        lng=lng,
        salary_min=body.salary_min,
        salary_max=body.salary_max,
        salary_currency=body.salary_currency,
        salary_period=body.salary_period,
        job_type=body.job_type,
        tags=body.tags,
        description=body.description,
        source="employer",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_to_out(job, None, user)


@router.post("/swipe", response_model=ApplicationOut | dict)
def swipe_job(
    body: SwipeAction,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Update match record
    match = db.query(Match).filter(
        Match.user_id == user.id,
        Match.job_id == body.job_id,
    ).first()
    if match:
        match.action = body.action
        match.seen = True
        db.commit()

    if body.action == "apply":
        # Check if already applied
        existing = db.query(Application).filter(
            Application.user_id == user.id,
            Application.job_id == body.job_id,
        ).first()
        if existing:
            return ApplicationOut.model_validate(existing)

        app = Application(
            user_id=user.id,
            job_id=body.job_id,
            match_score=match.score if match else None,
        )
        db.add(app)
        db.commit()
        db.refresh(app)
        return ApplicationOut.model_validate(app)

    return {"status": "skipped", "job_id": body.job_id}
