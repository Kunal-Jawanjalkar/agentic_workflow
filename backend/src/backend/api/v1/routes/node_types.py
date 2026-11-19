from fastapi import APIRouter

from backend.nodes.catalog import list_node_types
from backend.schemas.node_types import NodeTypeListResponse

router = APIRouter(prefix="/node-types", tags=["node-types"])


@router.get("", response_model=NodeTypeListResponse)
def list_node_types_endpoint() -> NodeTypeListResponse:
    return NodeTypeListResponse(node_types=list_node_types())
