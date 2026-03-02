"""
Regulatory Update Engine API — GET /regulatory/updates, GET /regulatory/feeds
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.models.user import User
from app.services.regulatory_service import RegulatoryService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/regulatory", tags=["Regulatory"])


@router.get("/updates", summary="Fetch latest regulatory updates from monitored feeds")
async def get_regulatory_updates(
    category:      Optional[str] = Query(None, description="Filter by category, e.g. Financial, Security, AI Governance"),
    jurisdiction:  Optional[str] = Query(None, description="Filter by jurisdiction, e.g. India, EU, Global"),
    force_refresh: bool          = Query(False, description="Bypass 1-hour cache and refetch from feeds"),
    _user:         User          = Depends(get_current_user),
) -> list[dict]:
    updates = await RegulatoryService.fetch_updates(force_refresh=force_refresh)

    if category:
        updates = [u for u in updates if u.get("category", "").lower() == category.lower()]
    if jurisdiction:
        updates = [u for u in updates if u.get("jurisdiction", "").lower() == jurisdiction.lower()]

    return updates


@router.get("/feeds", summary="List configured regulatory feed sources")
async def list_feeds(
    _user: User = Depends(get_current_user),
) -> list[dict]:
    return RegulatoryService.list_feeds()
