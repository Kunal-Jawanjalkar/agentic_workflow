from uuid import UUID

from fastapi import APIRouter, status

from backend.core.deps import CurrentUser, DbSession
from backend.schemas.workflows import (
    CreateWorkflowRequest,
    UpdateWorkflowRequest,
    WorkflowListResponse,
    WorkflowResponse,
)
from backend.services import workflows as workflow_service

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("", response_model=WorkflowListResponse)
def list_workflows(
    session: DbSession,
    current_user: CurrentUser,
) -> WorkflowListResponse:
    return workflow_service.list_workflows_for_owner(session, current_user.id)


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_workflow(
    body: CreateWorkflowRequest,
    session: DbSession,
    current_user: CurrentUser,
) -> WorkflowResponse:
    workflow = workflow_service.create_draft_workflow(session, current_user, body)
    return workflow_service.workflow_response(session, workflow)


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(
    workflow_id: UUID,
    session: DbSession,
    current_user: CurrentUser,
) -> WorkflowResponse:
    workflow = workflow_service.get_workflow_for_owner(session, current_user.id, workflow_id)
    return workflow_service.workflow_response(session, workflow)


@router.patch("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(
    workflow_id: UUID,
    body: UpdateWorkflowRequest,
    session: DbSession,
    current_user: CurrentUser,
) -> WorkflowResponse:
    workflow = workflow_service.update_draft_workflow(session, current_user, workflow_id, body)
    return workflow_service.workflow_response(session, workflow)