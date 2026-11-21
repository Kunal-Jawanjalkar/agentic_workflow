"""Shared pytest fixtures. Set test env before backend imports that read settings at load time."""

import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("COOKIE_SECURE", "false")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import app
from backend.core.config import get_settings
from backend.db.session import get_db
from backend.models.user import User
from backend.models.workflows import Trigger, Workflow, WorkflowVersion


@pytest.fixture(autouse=True)
def _clear_settings_cache() -> Generator[None]:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def engine():
    eng = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    for table in (User.__table__, Workflow.__table__, WorkflowVersion.__table__, Trigger.__table__):
        table.create(eng, checkfirst=True)
    return eng


@pytest.fixture
def db_session(engine) -> Generator[Session]:
    session = sessionmaker(autocommit=False, autoflush=False, bind=engine)()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient]:
    def override_get_db() -> Generator[Session]:
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(client, register_payload):
    client.post("/api/v1/auth/register", json=register_payload)
    from backend.core.cookies import ACCESS_TOKEN_COOKIE_NAME

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": register_payload["email"],
            "password": register_payload["password"],
        },
    )
    client.cookies.set(ACCESS_TOKEN_COOKIE_NAME, login.cookies[ACCESS_TOKEN_COOKIE_NAME])
    return client


@pytest.fixture
def register_payload() -> dict[str, str]:
    return {
        "email": "user@example.com",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
    }
