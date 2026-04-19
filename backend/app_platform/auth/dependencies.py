from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from database import get_db
from models.user import User

from .security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    return user
