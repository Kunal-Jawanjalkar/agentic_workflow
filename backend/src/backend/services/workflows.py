from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models.user import User
from backend.models.workflows import Workflow, WorkflowVersion
from backend.schemas.workflows import (
    CreateWorkflowRequest,
    UpdateWorkflowRequest,
    WorkflowGraphSchema,
    WorkflowListResponse,
    WorkflowResponse,
    WorkflowSummary,
)

EMPTY_GRAPH: dict[str, list] = {"nodes": [], "edges": []}


def _current_version(session: Session, workflow: Workflow) -> WorkflowVersion:
    if workflow.current_version_id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Workflow has no current version",
        )
    version = session.get(WorkflowVersion, workflow.current_version_id)
    if version is None or version.workflow_id != workflow.id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Workflow has no current version",
        )
    return version


def _trigger_type_from_graph(graph: dict[str, Any]) -> str | None:
    for node in graph.get("nodes", []):
        if not isinstance(node, dict):
            continue
        data = node.get("data")
        if not isinstance(data, dict):
            continue
        if data.get("type") != "trigger":
            continue
        config = data.get("config")
        if isinstance(config, dict):
            trigger_type = config.get("trigger_type")
            if isinstance(trigger_type, str) and trigger_type:
                return trigger_type
        return "manual"
    return None


def workflow_summary(session: Session, workflow: Workflow) -> WorkflowSummary:
    version = _current_version(session, workflow)
    return WorkflowSummary(
        id=workflow.id,
        name=workflow.name,
        description=workflow.description,
        status=workflow.status,
        version=version.version,
        trigger_type=_trigger_type_from_graph(version.graph),
        updated_at=workflow.updated_at,
    )


def workflow_response(session: Session, workflow: Workflow) -> WorkflowResponse:
    version = _current_version(session, workflow)
    return WorkflowResponse(
        id=workflow.id,
        name=workflow.name,
        description=workflow.description,
        status=workflow.status,
        version=version.version,
        graph=WorkflowGraphSchema.model_validate(version.graph),
        updated_at=workflow.updated_at,
    )


def list_workflows_for_owner(session: Session, owner_id: UUID) -> WorkflowListResponse:
    workflows = session.scalars(
        select(Workflow)
        .where(Workflow.owner_id == owner_id)
        .order_by(Workflow.updated_at.desc()),
    ).all()
    return WorkflowListResponse(
        workflows=[workflow_summary(session, workflow) for workflow in workflows],
    )


def get_workflow_for_owner(session: Session, owner_id: UUID, workflow_id: UUID) -> Workflow:
    workflow = session.get(Workflow, workflow_id)
    if workflow is None or workflow.owner_id != owner_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    return workflow


def create_draft_workflow(
    session: Session,
    user: User,
    body: CreateWorkflowRequest,
) -> Workflow:
    workflow = Workflow(
        owner_id=user.id,
        name=body.name,
        description=body.description,
        status="draft",
    )
    session.add(workflow)
    session.flush()

    version = WorkflowVersion(
        workflow_id=workflow.id,
        version=1,
        graph=EMPTY_GRAPH,
        created_by=user.id,
    )
    session.add(version)
    session.flush()

    workflow.current_version_id = version.id
    workflow.updated_at = datetime.now(UTC)
    session.commit()
    session.refresh(workflow)
    return workflow


def update_draft_workflow(
    session: Session,
    user: User,
    workflow_id: UUID,
    body: UpdateWorkflowRequest,
) -> Workflow:
    workflow = get_workflow_for_owner(session, user.id, workflow_id)
    if body.name is not None:
        workflow.name = body.name
    if body.description is not None:
        workflow.description = body.description

    if body.graph is not None:
        version = _current_version(session, workflow)
        version.graph = body.graph.model_dump()
        workflow.updated_at = datetime.now(UTC)

    if body.name is not None or body.description is not None:
        workflow.updated_at = datetime.now(UTC)

    session.commit()
    session.refresh(workflow)
    return workflow