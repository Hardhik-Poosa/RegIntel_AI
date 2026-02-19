from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
from fastapi.security import OAuth2PasswordRequestForm

from app.db.database import get_db
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token
)
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.schemas.auth import UserCreate, Token, UserResponse


router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(User.email == user_in.email)
    )
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists.",
        )

    new_org = Organization(
        name=user_in.organization.name,
        industry=user_in.organization.industry,
    )
    db.add(new_org)
    await db.flush()

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=UserRole.ADMIN,
        organization_id=new_org.id,
    )

    db.add(new_user)

    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    await db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.email == form_data.username)
    )
    user = result.scalars().first()

    if not user or not verify_password(
        form_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    access_token = create_access_token(
        subject=user.id,
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
