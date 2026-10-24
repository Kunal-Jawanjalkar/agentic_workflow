import pytest

from backend.core.config import Settings, get_settings


def test_cors_origin_list_splits_and_strips(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "sqlite://")
    monkeypatch.setenv("SECRET_KEY", "secret")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15")
    monkeypatch.setenv("CORS_ORIGINS", " http://a.com ,http://b.com, ")

    settings = Settings()

    assert settings.cors_origin_list == ["http://a.com", "http://b.com"]


def test_sqlalchemy_database_url_rewrites_postgresql_scheme(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql://user:pass@localhost:5432/db",
    )
    monkeypatch.setenv("SECRET_KEY", "secret")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15")

    settings = Settings()

    assert settings.sqlalchemy_database_url == (
        "postgresql+psycopg://user:pass@localhost:5432/db"
    )


def test_sqlalchemy_database_url_passes_through_non_postgresql(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    monkeypatch.setenv("SECRET_KEY", "secret")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15")

    settings = Settings()

    assert settings.sqlalchemy_database_url == "sqlite:///:memory:"


def test_get_settings_is_cached(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "sqlite://")
    monkeypatch.setenv("SECRET_KEY", "secret")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15")

    first = get_settings()
    second = get_settings()

    assert first is second
