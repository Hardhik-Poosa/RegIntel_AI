from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.auth import router as auth_router
from app.db.database import engine
from app.models.base import Base
from app.models import *



app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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