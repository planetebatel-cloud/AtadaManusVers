"""
ATADA — FastAPI Application
Main entry point. Mounts all API routers.
"""

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.config import settings
from app.db.database import engine, Base, SessionLocal
from app.api import auth, jobs, users, chat, payments, employer, parser, ai, uploads

logger = logging.getLogger("atada.main")

# Create all tables on startup (dev convenience — use Alembic in production)
Base.metadata.create_all(bind=engine)

# Lightweight in-place migrations for SQLite: add columns that exist on the
# model but not on a pre-existing users table. Idempotent.
def _ensure_user_columns():
    expected = {"avatar_url": "VARCHAR(500)"}
    with engine.connect() as conn:
        rows = conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()
        existing = {r[1] for r in rows}
        for col, type_ in expected.items():
            if col not in existing:
                conn.exec_driver_sql(f"ALTER TABLE users ADD COLUMN {col} {type_}")
                logger.info("Added column users.%s", col)
        conn.commit()

try:
    _ensure_user_columns()
except Exception as exc:  # noqa: BLE001
    logger.warning("Column migration skipped: %s", exc)

# Avatars / uploaded files are served from a static dir alongside the app.
UPLOAD_ROOT = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS — credentials must be off when origins is "*" (browser blocks otherwise)
_allow_credentials = "*" not in settings.CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=_allow_credentials,
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
app.include_router(ai.router)
app.include_router(uploads.router)

# Serve uploaded files (avatars, etc.)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_ROOT)), name="uploads")


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
