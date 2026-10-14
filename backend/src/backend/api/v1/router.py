from fastapi import APIRouter

from backend.api.v1.routes import auth

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
