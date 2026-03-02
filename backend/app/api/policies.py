"""
AI Policy Generator API — GET /policies/types, POST /policies/generate
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.user import User
from app.services.policy_service import PolicyService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/policies", tags=["Policies"])


# ── Request / Response schemas ─────────────────────────────────────────────────

class PolicyGenerateRequest(BaseModel):
    policy_type:       str
    organization_name: str
    industry:          str = "FinTech"
    jurisdiction:      str = "India"


class PolicyGenerateResponse(BaseModel):
    policy_type: str
    policy:      str


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/types", summary="List all available policy template types")
async def list_policy_types(
    _user: User = Depends(get_current_user),
) -> list[dict]:
    return PolicyService.available_types()


@router.post("/generate", response_model=PolicyGenerateResponse, summary="Generate a policy using AI")
async def generate_policy(
    payload: PolicyGenerateRequest,
    _user:   User = Depends(get_current_user),
) -> PolicyGenerateResponse:
    text = await PolicyService.generate(
        policy_type       = payload.policy_type,
        organization_name = payload.organization_name,
        industry          = payload.industry,
        jurisdiction      = payload.jurisdiction,
    )
    return PolicyGenerateResponse(policy_type=payload.policy_type, policy=text)
