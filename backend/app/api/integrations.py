"""
Integrations API.

Currently supports GitHub repository compliance scanning.
Future: Jira, Slack, AWS Security Hub, etc.

Endpoints:
  POST  /integrations/github/scan    — scan a GitHub repo
  GET   /integrations/               — list available integrations
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.integrations.github_service import GitHubIntegrationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/integrations", tags=["Integrations"])


class GitHubScanRequest(BaseModel):
    repo:  str = Field(..., pattern=r"^[\w.\-]+/[\w.\-]+$", description="owner/repo format")
    token: str | None = Field(None, description="Optional GitHub API token for private repos")


class IntegrationMeta(BaseModel):
    id:          str
    name:        str
    description: str
    status:      str    # "available" | "coming_soon"
    icon:        str


AVAILABLE_INTEGRATIONS = [
    IntegrationMeta(
        id="github", name="GitHub", icon="bi-github",
        description="Scan your repository for security policies, CODEOWNERS, Dependabot, and CI/CD pipelines.",
        status="available",
    ),
    IntegrationMeta(
        id="jira", name="Jira", icon="bi-kanban",
        description="Sync compliance actions with Jira issues for remediation tracking.",
        status="coming_soon",
    ),
    IntegrationMeta(
        id="slack", name="Slack", icon="bi-slack",
        description="Receive compliance alerts and AI Copilot answers directly in Slack.",
        status="coming_soon",
    ),
    IntegrationMeta(
        id="aws", name="AWS Security Hub", icon="bi-cloud-check",
        description="Import AWS Security Hub findings as controls for unified risk management.",
        status="coming_soon",
    ),
]


@router.get("/", response_model=list[IntegrationMeta])
async def list_integrations(current_user: User = Depends(get_current_user)):
    """Return the catalog of available / upcoming integrations."""
    return AVAILABLE_INTEGRATIONS


@router.post("/github/scan")
async def scan_github_repo(
    payload:      GitHubScanRequest,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Scan a public (or private with token) GitHub repository for compliance signals.
    Returns check results + a simple compliance score + recommendations.
    """
    try:
        result = await GitHubIntegrationService.scan_repo(
            repo=payload.repo, token=payload.token
        )
        return result
    except Exception as exc:
        logger.error("GitHub scan failed for %s: %s", payload.repo, exc)
        raise HTTPException(status_code=502, detail=f"GitHub scan failed: {exc}")
