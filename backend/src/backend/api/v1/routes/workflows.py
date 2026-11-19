from typing import Annotated
from backend.core.deps import CurrentUser
from backend.db.session import get_db
from backend.models import Workflow
from backend.schemas.workflows import CreateWorkflowRequest, CreateWorkflowResponse
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

DbSession = Annotated[Session, Depends(get_db)]

router = APIRouter(prefix="/workflows", tags=["workflows"])

@router.post("", response_model=CreateWorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_workflow(body: CreateWorkflowRequest, session: DbSession, current_user: CurrentUser) -> Workflow:
    
    workflow = Workflow(
        owner_id = current_user.id,
        name = body.name,
        description = body.description
        
    )
