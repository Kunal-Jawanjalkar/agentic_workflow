from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class WorkflowGraphSchema(BaseModel):
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)


class CreateWorkflowRequest(BaseModel):
    name: str = Field(default="Untitled workflow", min_length=1, max_length=200)
    description: str | None = None


class UpdateWorkflowRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    graph: WorkflowGraphSchema | None = None


class WorkflowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    status: str
    version: int
    graph: WorkflowGraphSchema
    updated_at: datetime


class WorkflowSummary(BaseModel):
    id: UUID
    name: str
    description: str | None
    status: str
    version: int
    trigger_type: str | None = None
    updated_at: datetime


class WorkflowListResponse(BaseModel):
    workflows: list[WorkflowSummary]