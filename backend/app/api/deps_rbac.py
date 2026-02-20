from fastapi import Depends, HTTPException, status
from typing import Callable
from app.models.user import User, UserRole
from app.api.deps import get_current_active_user


def require_roles(*allowed_roles: UserRole) -> Callable:
    async def role_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return role_checker