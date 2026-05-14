from pydantic_settings import BaseSettings
from pathlib import Path

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

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"


settings = Settings()
