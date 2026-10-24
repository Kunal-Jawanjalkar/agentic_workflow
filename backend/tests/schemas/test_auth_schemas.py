import pytest
from pydantic import ValidationError

from backend.schemas.auth import LoginRequest, RegisterRequest


def test_register_request_accepts_valid_payload() -> None:
    data = RegisterRequest(
        email="user@example.com",
        password="longenough",
        first_name="Ada",
        last_name="Lovelace",
    )

    assert data.email == "user@example.com"


def test_register_request_rejects_short_password() -> None:
    with pytest.raises(ValidationError):
        RegisterRequest(
            email="user@example.com",
            password="short",
            first_name="Ada",
            last_name="Lovelace",
        )


def test_register_request_rejects_invalid_email() -> None:
    with pytest.raises(ValidationError):
        RegisterRequest(
            email="not-an-email",
            password="longenough",
            first_name="Ada",
            last_name="Lovelace",
        )


def test_login_request_requires_non_empty_password() -> None:
    with pytest.raises(ValidationError):
        LoginRequest(email="user@example.com", password="")
