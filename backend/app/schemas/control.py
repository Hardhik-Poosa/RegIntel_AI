from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime

from app.models.control import ControlStatus, ControlRisk


class ControlBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str | None = None
    status: ControlStatus = ControlStatus.MISSING
    risk_score: ControlRisk = ControlRisk.MEDIUM


class ControlCreate(ControlBase):
    pass


class ControlUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=255)
    description: str | None = None
    status: ControlStatus | None = None
    risk_score: ControlRisk | None = None


class ControlResponse(ControlBase):
    id: UUID
    organization_id: UUID
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
