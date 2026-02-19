from fastapi import APIRouter, Depends
from app.core.security import get_current_active_user
from app.services.ai_service import AIService
from app.models.user import User

router = APIRouter()


@router.post("/chat")
async def chat_with_ai(
    prompt: str,
    current_user: User = Depends(get_current_active_user)
):
    response = await AIService.chat(
        [
            {"role": "system", "content": "You are a compliance expert AI assistant."},
            {"role": "user", "content": prompt}
        ]
    )

    return {"response": response}
