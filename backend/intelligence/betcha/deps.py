"""JWT auth for intelligence routes (Bearer token, same as platform)."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends

from app_platform.auth.dependencies import get_current_user
from models.user import User


def user_int_id_to_uuid(user_id: int) -> UUID:
    """Stable UUID for intelligence tables that expect UUID user ids."""
    return UUID(int=user_id)


async def get_current_user_id(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UUID:
    return user_int_id_to_uuid(current_user.id)
