from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.core.config import get_settings
from backend.core.cookies import ACCESS_TOKEN_COOKIE_NAME
from backend.core.security import JWT_ALGORITHM
from backend.db.session import get_db
from backend.models.user import User

DbSession = Annotated[Session, Depends(get_db)]


def get_access_token_from_cookie(request: Request) -> str:
    token = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return token


def get_token_subject(token: Annotated[str, Depends(get_access_token_from_cookie)]) -> UUID:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[JWT_ALGORITHM],
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        ) from None

    subject = payload.get("sub")
    if not isinstance(subject, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )

    try:
        return UUID(subject)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        ) from None


def get_current_user(
    db: DbSession,
    user_id: Annotated[UUID, Depends(get_token_subject)],
) -> User:
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
