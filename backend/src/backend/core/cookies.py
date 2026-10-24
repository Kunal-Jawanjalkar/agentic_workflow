from fastapi import Response

from backend.core.config import get_settings

ACCESS_TOKEN_COOKIE_NAME = "access_token"


def set_access_token_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        value=token,
        max_age=settings.access_token_expire_minutes * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


def clear_access_token_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        path="/",
        secure=settings.cookie_secure,
        httponly=True,
        samesite="lax",
    )
