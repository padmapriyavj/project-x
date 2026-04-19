import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models.user import User

from .dependencies import get_current_user
from .schemas import AuthResponse, LoginRequest, SignupRequest, UserResponse
from .security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
def signup(body: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    existing = db.execute(select(User).where(User.email == str(body.email))).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    avatar_config = {"seed": str(uuid.uuid4()), "style": "adventurer"}
    user = User(
        email=str(body.email),
        password_hash=hash_password(body.password),
        role=body.role,
        display_name=body.display_name,
        avatar_config=avatar_config,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.role)
    return AuthResponse(
        user=UserResponse.model_validate(user),
        access_token=token,
    )


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.execute(select(User).where(User.email == str(body.email))).scalar_one_or_none()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user.id, user.role)
    return AuthResponse(
        user=UserResponse.model_validate(user),
        access_token=token,
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user


@router.post("/logout")
def logout() -> dict[str, str]:
    return {"message": "Logged out"}
