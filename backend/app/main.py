"""
ATADA — FastAPI Application
Main entry point. Mounts all API routers.
"""

import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

# Sentry init must happen before the app is created so the FastAPI
# integration can patch route handlers. No-op when SENTRY_DSN is empty.
_SENTRY_DSN = os.getenv("SENTRY_DSN", "").strip()
if _SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    sentry_sdk.init(
        dsn=_SENTRY_DSN,
        environment=os.getenv("SENTRY_ENV", "production"),
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
        # Don't fingerprint individual user IPs into events
        send_default_pii=False,
        integrations=[FastApiIntegration(transaction_style="endpoint")],
    )

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.db.database import engine, Base, SessionLocal
from app.api import auth, jobs, users, chat, payments, employer, parser, ai, uploads
from app.services.rate_limit import limiter

logger = logging.getLogger("atada.main")

# Create all tables on startup (dev convenience — use Alembic in production)
Base.metadata.create_all(bind=engine)

# Lightweight idempotent column adds — covers both SQLite (PRAGMA) and
# Postgres (information_schema). For real schema changes use alembic; this
# helper exists so an already-created `users` table picks up new optional
# columns without dropping data.
def _ensure_user_columns():
    expected = {"avatar_url": "VARCHAR(500)"}
    dialect = engine.dialect.name  # "sqlite" | "postgresql"
    with engine.connect() as conn:
        if dialect == "sqlite":
            rows = conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()
            existing = {r[1] for r in rows}
        else:
            rows = conn.exec_driver_sql(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
            ).fetchall()
            existing = {r[0] for r in rows}
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

# Rate limiter: shared Limiter is registered on the app so @limiter.limit
# decorators on routes can read state via `request.app.state.limiter`.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

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
