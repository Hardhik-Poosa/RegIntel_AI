from fastapi import APIRouter, Depends
from app.core.security import get_current_active_user
from app.models.user import User

router = APIRouter()


@router.get("/me")
async def read_current_user(
    current_user: User = Depends(get_current_active_user)
):
    return current_user
