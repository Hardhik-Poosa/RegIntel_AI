"""
AI Compliance Copilot API.

POST /api/v1/copilot/ask  — ask a compliance question
GET  /api/v1/copilot/context — preview the context the LLM receives
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.copilot_service import CopilotService

router = APIRouter()


class CopilotQuestion(BaseModel):
    question: str


class CopilotAnswer(BaseModel):
    question: str
    answer: str


@router.post("/ask", response_model=CopilotAnswer)
async def ask_copilot(
    payload: CopilotQuestion,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Ask the AI compliance copilot a question about your organisation.

    Example questions:
     - "Which controls should we fix first?"
     - "Are we compliant with RBI FinTech guidelines?"
     - "Explain our compliance trend and what's causing the drop."
     - "Which HIGH-risk controls are still missing?"
    """
    answer = await CopilotService.ask(db, current_user.organization_id, payload.question)
    return {"question": payload.question, "answer": answer}


@router.get("/context")
async def get_copilot_context(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Return the compliance context that would be sent to the AI.
    Useful for debugging and transparency (shows users what the AI knows).
    """
    return await CopilotService.build_context(db, current_user.organization_id)
