from __future__ import annotations
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "RegIntel AI"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database
    DATABASE_URL: str

    # AI service (LM Studio locally, or OpenAI-compatible endpoint in prod)
    AI_BASE_URL: str = "http://127.0.0.1:1234/v1/chat/completions"
    AI_MODEL: str = "qwen2.5-coder-7b-instruct"

    # CORS — accepts both JSON array string or comma-separated string from Railway env
    # Examples that all work:
    #   ALLOWED_ORIGINS=["https://app.regintel.ai"]          (JSON array)
    #   ALLOWED_ORIGINS=https://app.regintel.ai               (single URL)
    #   ALLOWED_ORIGINS=https://a.com,https://b.com           (comma-separated)
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: object) -> list[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                return json.loads(v)          # JSON array string
            return [o.strip() for o in v.split(",") if o.strip()]  # comma-separated
        raise ValueError(f"ALLOWED_ORIGINS must be a list or string, got {type(v)}")

    # Redis (Celery broker + result backend)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Environment flag
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )


settings = Settings()
