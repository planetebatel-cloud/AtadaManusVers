"""
ATADA — Job Parser API Routes
POST /api/parser/parse          → parse screenshot, save job to DB, return it
POST /api/parser/parse/preview  → parse screenshot, return JSON without saving
"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.domain.models import Job
from app.domain.schemas import JobOut
from app.api.deps import get_optional_user
from app.services.parser import parse_job_screenshot

router = APIRouter(prefix="/api/parser", tags=["parser"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/parse", response_model=JobOut)
async def parse_and_create(
    file: UploadFile = File(...),
    user=Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Parse a job screenshot and create the job in the database."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}. Use JPEG, PNG or WebP.")

    image_bytes = await file.read()
    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 20MB)")

    try:
        parsed = await parse_job_screenshot(image_bytes, file.content_type)
    except Exception as e:
        raise HTTPException(422, f"Failed to parse image: {e}")

    job = Job(
        employer_id=user.id if user else None,
        title=parsed.get("title", "Untitled"),
        company=parsed.get("company", "Unknown"),
        location=parsed.get("location", "Israel"),
        salary_min=parsed.get("salary_min"),
        salary_max=parsed.get("salary_max"),
        salary_currency=parsed.get("salary_currency", "ILS"),
        salary_period=parsed.get("salary_period", "month"),
        job_type=parsed.get("job_type", "full-time"),
        tags=parsed.get("tags", []),
        description=parsed.get("description"),
        source="parser",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

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
    )


@router.post("/parse/preview")
async def parse_preview(
    file: UploadFile = File(...),
):
    """Parse a job screenshot and return extracted data without saving."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}. Use JPEG, PNG or WebP.")

    image_bytes = await file.read()
    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 20MB)")

    try:
        parsed = await parse_job_screenshot(image_bytes, file.content_type)
    except Exception as e:
        raise HTTPException(422, f"Failed to parse image: {e}")

    return parsed
