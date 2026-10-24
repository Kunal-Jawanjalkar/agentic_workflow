from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import jwt

from backend.core.config import get_settings
from backend.core.security import (
    JWT_ALGORITHM,
    create_access_token,
    hash_password,
    verify_password,
)


def test_hash_password_and_verify_succeeds_for_correct_password() -> None:
    hashed = hash_password("correct-horse-battery-staple")

    assert hashed != "correct-horse-battery-staple"
    assert verify_password("correct-horse-battery-staple", hashed) is True


def test_verify_password_returns_false_for_wrong_password() -> None:
    hashed = hash_password("secret-password")

    assert verify_password("wrong-password", hashed) is False


def test_create_access_token_encodes_subject_and_expiry() -> None:
    user_id = uuid4()
    settings = get_settings()

    token = create_access_token(user_id, extra_claims={"role": "tester"})
    payload = jwt.decode(token, settings.secret_key, algorithms=[JWT_ALGORITHM])

    assert payload["sub"] == str(user_id)
    assert payload["role"] == "tester"
    exp = datetime.fromtimestamp(payload["exp"], tz=UTC)
    expected_min = datetime.now(UTC) + timedelta(
        minutes=settings.access_token_expire_minutes - 1
    )
    assert exp > expected_min
