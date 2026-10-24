from unittest.mock import MagicMock
from uuid import uuid4

import jwt
import pytest
from fastapi import HTTPException

from backend.core.config import get_settings
from backend.core.deps import (
    get_access_token_from_cookie,
    get_current_user,
    get_token_subject,
)
from backend.core.security import JWT_ALGORITHM, create_access_token
from backend.models.user import User


def test_get_access_token_from_cookie_raises_when_missing() -> None:
    request = MagicMock()
    request.cookies = {}

    with pytest.raises(HTTPException) as exc_info:
        get_access_token_from_cookie(request)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Not authenticated"


def test_get_access_token_from_cookie_returns_token() -> None:
    request = MagicMock()
    request.cookies = {"access_token": "abc"}

    assert get_access_token_from_cookie(request) == "abc"


def test_get_token_subject_returns_uuid_from_valid_token() -> None:
    user_id = uuid4()
    token = create_access_token(user_id)

    assert get_token_subject(token) == user_id


def test_get_token_subject_raises_for_invalid_token() -> None:
    with pytest.raises(HTTPException) as exc_info:
        get_token_subject("not-a-jwt")

    assert exc_info.value.status_code == 401


def test_get_token_subject_raises_when_sub_missing() -> None:
    settings = get_settings()
    token = jwt.encode(
        {"exp": 9_999_999_999},
        settings.secret_key,
        algorithm=JWT_ALGORITHM,
    )

    with pytest.raises(HTTPException) as exc_info:
        get_token_subject(token)

    assert exc_info.value.detail == "Invalid or expired session"


def test_get_current_user_raises_when_user_not_found(db_session) -> None:
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(db_session, uuid4())

    assert exc_info.value.status_code == 401


def test_get_current_user_raises_when_user_inactive(db_session) -> None:
    user = User(
        email="inactive@example.com",
        first_name="In",
        last_name="Active",
        hashed_password="hash",
        is_active=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(db_session, user.id)

    assert exc_info.value.status_code == 401


def test_get_current_user_returns_active_user(db_session) -> None:
    user = User(
        email="active@example.com",
        first_name="Ac",
        last_name="Tive",
        hashed_password="hash",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    result = get_current_user(db_session, user.id)

    assert result.id == user.id
    assert result.email == "active@example.com"
