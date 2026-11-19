from typing import Any

from pydantic import BaseModel


class NodeTypeSchema(BaseModel):
    type: str
    version: int
    label: str
    category: str
    icon: str
    outputs: list[str]
    config_schema: dict[str, Any]


class NodeTypeListResponse(BaseModel):
    node_types: list[NodeTypeSchema]
