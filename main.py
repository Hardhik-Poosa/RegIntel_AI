from fastapi import FastAPI
from backend.app.core.config import settings
from backend.app.api import auth
from backend.app.db.database import Base, engine

# Create tables (For development only - use Alembic for migrations in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])

@app.get("/")
def root():
    return {"message": "Welcome to the Backend Foundation"}