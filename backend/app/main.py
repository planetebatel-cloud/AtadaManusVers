"""
ATADA — FastAPI Application
Main entry point. Mounts all API routers.
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import engine, Base, SessionLocal
from app.api import auth, jobs, users, chat, payments, employer, parser

logger = logging.getLogger("atada.main")

# Create all tables on startup (dev convenience — use Alembic in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(users.router)
app.include_router(chat.router)
app.include_router(payments.router)
app.include_router(employer.router)
app.include_router(parser.router)


@app.on_event("startup")
def auto_seed_if_empty():
    """Seed the database from seed_realistic.py if jobs table is empty.

    Render's free tier has no persistent disk — SQLite resets on every
    deploy/restart. Auto-seeding guarantees the demo always has data,
    including the two whitelisted demo accounts.
    """
    from app.domain.models import Job

    db = SessionLocal()
    try:
        if db.query(Job).count() > 0:
            return
    finally:
        db.close()

    try:
        # Import lazily so the backend still boots even if the seeder is missing
        import sys
        from pathlib import Path
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
        from seed_realistic import main as seed_main  # type: ignore
        logger.info("Database empty — running seed_realistic...")
        seed_main()
        logger.info("Auto-seed complete.")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Auto-seed skipped: %s", exc)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}
