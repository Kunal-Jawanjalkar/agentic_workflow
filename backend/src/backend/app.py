from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI

from backend.api.v1.router import api_router
from backend.db.base import Base
from backend.db.session import engine
from backend.models import User  # noqa: F401 — register models with metadata


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Backend API", lifespan=lifespan)

app.include_router(api_router)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Hello, World"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
