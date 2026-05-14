"""
ATADA — FastAPI Application
Main entry point. Mounts all API routers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import engine, Base
from app.api import auth, jobs, users, chat, payments, employer, parser

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


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}
