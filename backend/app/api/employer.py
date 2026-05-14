"""
ATADA — Employer API Routes
GET  /api/employer/dashboard   → employer stats
GET  /api/employer/applicants  → applicants for employer's jobs
PATCH /api/employer/applicants/:id → update application status
POST /api/employer/jobs         → post a new job (alias for /api/jobs)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.domain.models import User, Job, Application
from app.domain.schemas import ApplicationOut, ApplicationStatusUpdate, JobOut, JobCreate
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/employer", tags=["employer"])


def _require_employer(user: User):
    if user.role != "employer":
        raise HTTPException(status_code=403, detail="Employer access required")


@router.get("/dashboard")
def get_dashboard(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_employer(user)

    total_jobs = db.query(func.count(Job.id)).filter(Job.employer_id == user.id).scalar()
    active_jobs = db.query(func.count(Job.id)).filter(
        Job.employer_id == user.id, Job.is_active == True
    ).scalar()

    # Count applicants across all employer's jobs
    total_applicants = (
        db.query(func.count(Application.id))
        .join(Job, Application.job_id == Job.id)
        .filter(Job.employer_id == user.id)
        .scalar()
    )

    new_applicants = (
        db.query(func.count(Application.id))
        .join(Job, Application.job_id == Job.id)
        .filter(Job.employer_id == user.id, Application.status == "applied")
        .scalar()
    )

    return {
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "total_applicants": total_applicants,
        "new_applicants": new_applicants,
        "plan": user.plan,
    }


@router.get("/applicants", response_model=list[ApplicationOut])
def list_applicants(
    status: str | None = Query(None),
    job_id: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_employer(user)

    query = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(Job.employer_id == user.id)
    )

    if status:
        query = query.filter(Application.status == status)
    if job_id:
        query = query.filter(Application.job_id == job_id)

    apps = query.order_by(Application.created_at.desc()).all()
    return [ApplicationOut.model_validate(a) for a in apps]


@router.patch("/applicants/{app_id}", response_model=ApplicationOut)
def update_applicant_status(
    app_id: str,
    body: ApplicationStatusUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_employer(user)

    app = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(Application.id == app_id, Job.employer_id == user.id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = body.status
    db.commit()
    db.refresh(app)
    return ApplicationOut.model_validate(app)


@router.post("/jobs", response_model=JobOut)
def post_job(
    body: JobCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_employer(user)

    from app.domain.models import Job as JobModel
    job = JobModel(
        employer_id=user.id,
        title=body.title,
        company=body.company or user.name or "Company",
        location=body.location,
        lat=body.lat,
        lng=body.lng,
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
    return JobOut.model_validate(job)
