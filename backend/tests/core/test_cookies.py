from starlette.responses import Response

from backend.core.config import get_settings
from backend.core.cookies import (
    ACCESS_TOKEN_COOKIE_NAME,
    clear_access_token_cookie,
    set_access_token_cookie,
)


def test_set_access_token_cookie_sets_httponly_lax_cookie() -> None:
    settings = get_settings()
    response = Response()
    set_access_token_cookie(response, "jwt-token-value")

    cookie_header = response.headers.get("set-cookie", "")

    assert ACCESS_TOKEN_COOKIE_NAME in cookie_header
    assert "jwt-token-value" in cookie_header
    assert "HttpOnly" in cookie_header
    assert "SameSite=lax" in cookie_header
    assert f"Max-Age={settings.access_token_expire_minutes * 60}" in cookie_header


def test_clear_access_token_cookie_deletes_access_token() -> None:
    response = Response()
    clear_access_token_cookie(response)

    cookie_headers = [
        value.decode() if isinstance(value, bytes) else value
        for key, value in response.raw_headers
        if key.decode().lower() == "set-cookie"
    ]

    assert len(cookie_headers) == 1
    header = cookie_headers[0].lower()
    assert ACCESS_TOKEN_COOKIE_NAME in header
    assert "max-age=0" in header
