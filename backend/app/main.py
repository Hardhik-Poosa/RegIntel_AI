from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.auth import router as auth_router
from app.db.database import engine
from app.models.base import Base
from app.models import *
from app.api import audit
from app.api import compliance
from app.api import dashboard
from app.core.logging import setup_logging
import logging

setup_logging()
logger = logging.getLogger(__name__)


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# In production, ALLOWED_ORIGINS must be set to your frontend domain.
# Example: ALLOWED_ORIGINS=["https://app.regintel.ai"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    auth_router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["auth"]
)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/")
async def root():
    return {"message": "Welcome to RegIntel AI API"}


@app.get("/health", tags=["health"])
async def health_check():
    """Liveness probe — returns 200 when the app is running."""
    return {"status": "ok", "environment": settings.ENVIRONMENT}


# —— Production: suppress internal error details in responses ———————————————————————
if settings.ENVIRONMENT == "production":
    @app.exception_handler(Exception)
    async def production_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error on %s", request.url)
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected error occurred. Our team has been notified."},
        )

from app.api.users import router as users_router

app.include_router(
    users_router,
    prefix=f"{settings.API_V1_STR}/users",
    tags=["users"]
)


from app.api.ai import router as ai_router

app.include_router(
    ai_router,
    prefix=f"{settings.API_V1_STR}/ai",
    tags=["ai"]
)


from app.api.controls import router as controls_router

app.include_router(
    controls_router,
    prefix=f"{settings.API_V1_STR}/controls",
    tags=["controls"],                      
)

app.include_router(audit.router, prefix="/api/v1")
app.include_router(compliance.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")

from app.api import admin as admin_module
app.include_router(admin_module.router, prefix="/api/v1/admin", tags=["admin"])
