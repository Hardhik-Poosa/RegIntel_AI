from fastapi import APIRouter, Depends, Query
from app.services.ai_service import AIService
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/chat")
async def chat_with_ai(
    prompt: str = Query(...),
    current_user: User = Depends(get_current_active_user),
):
    response = await AIService.chat(prompt)
    return {"response": response}