from fastapi import APIRouter

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get("/")
async def health_metrics():
    return {
        "service": "RegIntel AI",
        "status": "healthy",
        "version": "1.0.0"
    }