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

    # CORS — comma-separated list, or JSON array in env var
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # Environment flag
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )


settings = Settings()
