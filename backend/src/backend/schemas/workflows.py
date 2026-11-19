from uuid import UUID
from pydantic import BaseModel


class CreateWorkflowResponse(BaseModel):
    id: UUID
    name: str

class CreateWorkflowRequest(BaseModel):
    name: str
    description: str
    status: str
    current_version_id: UUID

