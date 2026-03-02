from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

from app.models.control import ControlStatus, ControlRisk


class ControlBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str | None = None
    status: ControlStatus = ControlStatus.MISSING
    risk_score: ControlRisk = ControlRisk.MEDIUM


class ControlCreate(ControlBase):
    framework_id: Optional[UUID] = None


class ControlUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=255)
    description: str | None = None
    status: ControlStatus | None = None
    risk_score: ControlRisk | None = None
    framework_id: Optional[UUID] = None


class ControlResponse(ControlBase):
    id: UUID
    organization_id: UUID
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime
    # AI fields
    ai_status:         str   | None = "pending"
    ai_analysis:       str   | None = None
    ai_suggested_risk: str   | None = None
    ai_category:       str   | None = None
    ai_confidence:     float | None = None
    # Framework
    framework_id:      UUID  | None = None

    model_config = ConfigDict(from_attributes=True)