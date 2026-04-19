"""Stub auth for Betcha routes; swap for JWT when auth is wired."""

from typing import Annotated
from uuid import UUID

from fastapi import Header, HTTPException, status

'''
Check with Person A on this implementation -> Should ask them to add X-User-Id header to the request
'''
async def get_current_user_id(
    x_user_id: Annotated[UUID | None, Header(alias="X-User-Id")] = None,
) -> UUID:
    if x_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required (stub: send X-User-Id header)",
        )
    return x_user_id
