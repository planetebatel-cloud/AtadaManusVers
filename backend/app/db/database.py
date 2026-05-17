"""
Database engine + session factory.

Supports both SQLite (default, dev) and PostgreSQL (Neon/Render Postgres in
production). The driver is auto-detected from DATABASE_URL:

  sqlite:///./atada.db              → SQLite (single-file, dev)
  postgres://user:pass@host/db      → normalized to postgresql+psycopg
  postgresql://user:pass@host/db    → same
  postgresql+psycopg://...          → used as-is (psycopg3)

On Render: set DATABASE_URL env var to the Neon connection string. SQLite
fallback stays for local dev so nothing breaks if Postgres isn't configured.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings


def _normalize_url(url: str) -> str:
    # Neon and Heroku-style URLs start with "postgres://", but SQLAlchemy 2
    # only recognizes the explicit "postgresql://" form. Also force psycopg3
    # (the modern driver, async-friendly) when no driver is specified.
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


_url = _normalize_url(settings.DATABASE_URL)
_is_sqlite = _url.startswith("sqlite")

# SQLite needs check_same_thread=False because FastAPI's threadpool dispatches
# requests across threads. Postgres doesn't have that constraint and providing
# the arg would crash psycopg.
_engine_kwargs = {"echo": settings.DEBUG}
if _is_sqlite:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Conservative pool settings for free-tier Postgres (Neon's free plan
    # caps concurrent connections fairly tight).
    _engine_kwargs["pool_size"] = 5
    _engine_kwargs["max_overflow"] = 5
    _engine_kwargs["pool_pre_ping"] = True
    _engine_kwargs["pool_recycle"] = 1800  # 30 min — cuts stale-connection errors

engine = create_engine(_url, **_engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
