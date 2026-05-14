import json
from pathlib import Path
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    APP_NAME: str = "Atada API"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'atada.db'}"

    # JWT
    JWT_SECRET: str = "atada-dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TTL_MINUTES: int = 60 * 24  # 24 hours
    JWT_REFRESH_TTL_DAYS: int = 30

    # SMS OTP (mock — prints to console)
    OTP_LENGTH: int = 6
    OTP_TTL_SECONDS: int = 300  # 5 min

    # Stripe (test mode)
    STRIPE_SECRET_KEY: str = "sk_test_PLACEHOLDER"
    STRIPE_WEBHOOK_SECRET: str = "whsec_PLACEHOLDER"

    # LLM (MiniMax)
    MINIMAX_API_KEY: str = ""
    MINIMAX_GROUP_ID: str = ""
    MINIMAX_MODEL: str = "MiniMax-Text-01"

    # Maps / commute (optional — empty → haversine estimate, no external calls)
    GOOGLE_MAPS_API_KEY: str = ""

    # CORS — accepts JSON list, comma-separated list, or "*"
    # NoDecode keeps the env var as a raw string so the validator below owns
    # parsing — pydantic-settings would otherwise try json.loads first and
    # fail on "*" or "https://a.com,https://b.com".
    CORS_ORIGINS: Annotated[list[str], NoDecode] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            if v == "*":
                return ["*"]
            if v.startswith("["):
                return json.loads(v)
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"


settings = Settings()
