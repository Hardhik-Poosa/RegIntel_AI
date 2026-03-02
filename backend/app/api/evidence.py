"""
Evidence Management API.

Endpoints:
  POST   /evidence/upload/{control_id}   — upload a file
  GET    /evidence/{control_id}          — list evidence for a control
  DELETE /evidence/{evidence_id}         — delete a file
  GET    /evidence/item/{evidence_id}    — get single evidence item
"""
from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.evidence_service import EvidenceService
from app.services.evidence_ai_scanner import EvidenceAIScanner

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/evidence", tags=["Evidence"])

MAX_UPLOAD_BYTES = 20 * 1024 * 1024   # 20 MB


class EvidenceItemOut(BaseModel):
    id:             UUID
    control_id:     UUID
    file_name:      str
    file_url:       str
    file_size:      float | None
    mime_type:      str | None
    ai_valid:       bool | None
    ai_confidence:  float | None
    ai_explanation: str | None

    class Config:
        from_attributes = True


@router.post("/upload/{control_id}", response_model=EvidenceItemOut, status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    control_id: UUID,
    file: UploadFile = File(...),
    db:   AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a file as evidence for a specific control."""
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_UPLOAD_BYTES // (1024*1024)} MB limit.")

    file_url, file_size = await EvidenceService.save_file(
        content, file.filename or "upload", file.content_type
    )

    ev = await EvidenceService.create(
        db,
        control_id  = control_id,
        uploaded_by = current_user.id,
        file_name   = file.filename or "upload",
        file_url    = file_url,
        file_size   = file_size,
        mime_type   = file.content_type,
    )

    # Kick off AI scan in the background (non-blocking)
    import asyncio
    asyncio.create_task(_run_ai_scan(db, ev.id, file_url, file.filename or "", file.content_type))

    return ev


async def _run_ai_scan(db: AsyncSession, evidence_id: UUID, file_url: str, file_name: str, mime_type: str | None):
    """Run the AI evidence scanner and persist the result."""
    try:
        result = await EvidenceAIScanner.analyze(file_url, file_name, mime_type)
        ev = await EvidenceService.get_by_id(db, evidence_id=evidence_id)
        if ev and result.get("valid") is not None:
            await EvidenceService.update_ai_result(
                db,
                ev=ev,
                ai_valid=result["valid"],
                ai_confidence=result["confidence"],
                ai_explanation=result["explanation"],
            )
    except Exception as exc:
        logger.error("Background AI scan failed for evidence %s: %s", evidence_id, exc)


@router.get("/{control_id}", response_model=list[EvidenceItemOut])
async def list_evidence(
    control_id:   UUID,
    db:           AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all evidence items for a control."""
    return await EvidenceService.list_for_control(db, control_id=control_id)


@router.get("/item/{evidence_id}", response_model=EvidenceItemOut)
async def get_evidence_item(
    evidence_id:  UUID,
    db:           AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ev = await EvidenceService.get_by_id(db, evidence_id=evidence_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence item not found.")
    return ev


@router.delete("/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_evidence(
    evidence_id:  UUID,
    db:           AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ev = await EvidenceService.get_by_id(db, evidence_id=evidence_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence item not found.")
    await EvidenceService.delete(db, ev=ev)
