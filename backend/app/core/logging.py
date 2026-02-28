import logging
import os


def setup_logging() -> None:
    """
    Configure root logger.
    - ENVIRONMENT=production  → INFO  (no debug noise, no stack traces in logs)
    - Everything else          → DEBUG (full detail for development)
    """
    env = os.getenv("ENVIRONMENT", "development").lower()
    level = logging.INFO if env == "production" else logging.DEBUG

    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )

    if env == "production":
        # Silence noisy third-party loggers in production
        for noisy in ("sqlalchemy.engine", "httpx", "httpcore", "uvicorn.access"):
            logging.getLogger(noisy).setLevel(logging.WARNING)