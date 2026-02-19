from pydantic import BaseModel, EmailStr
from uuid import UUID


class OrganizationCreate(BaseModel):
    name: str
    industry: str | None = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    organization: OrganizationCreate


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    organization_id: UUID

    model_config = {
        "from_attributes": True
    }


class TokenData(BaseModel):
    email: EmailStr | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    industry: str | None = None
    created_at: str
    updated_at: str

    model_config = {
        "from_attributes": True
    }


class OrganizationUpdate(BaseModel):
    name: str | None = None
    industry: str | None = None


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    password: str | None = None
    full_name: str | None = None
    role: str | None = None
    is_active: bool | None = None
    organization_id: UUID | None = None
    organization: OrganizationUpdate | None = None