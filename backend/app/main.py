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

# ── Phase 4 routes ─────────────────────────────────────────────────────────────
from app.api.frameworks import router as frameworks_router
app.include_router(
    frameworks_router,
    prefix=f"{settings.API_V1_STR}/frameworks",
    tags=["frameworks"],
)

from app.api.copilot import router as copilot_router
app.include_router(
    copilot_router,
    prefix=f"{settings.API_V1_STR}/copilot",
    tags=["copilot"],
)

from app.api.risk import router as risk_router
app.include_router(
    risk_router,
    prefix=f"{settings.API_V1_STR}/risk",
    tags=["risk"],
)

# ── Phase 5 routes ─────────────────────────────────────────────────────────────
from app.api.evidence import router as evidence_router
app.include_router(
    evidence_router,
    prefix=f"{settings.API_V1_STR}",
    tags=["Evidence"],
)

from app.api.integrations import router as integrations_router
app.include_router(
    integrations_router,
    prefix=f"{settings.API_V1_STR}",
    tags=["Integrations"],
)

# ── Phase 6 routes ─────────────────────────────────────────────────────────────
from app.api.monitors import router as monitors_router
app.include_router(
    monitors_router,
    prefix=f"{settings.API_V1_STR}",
    tags=["Monitors"],
)

from app.api.policies import router as policies_router
app.include_router(
    policies_router,
    prefix=f"{settings.API_V1_STR}",
    tags=["Policies"],
)

from app.api.vendors import router as vendors_router
app.include_router(
    vendors_router,
    prefix=f"{settings.API_V1_STR}",
    tags=["Vendors"],
)

from app.api.regulatory import router as regulatory_router
app.include_router(
    regulatory_router,
    prefix=f"{settings.API_V1_STR}",
    tags=["Regulatory"],
)

from app.api.alerts import router as alerts_router
app.include_router(
    alerts_router,
    prefix=f"{settings.API_V1_STR}",
    tags=["Alerts"],
)
