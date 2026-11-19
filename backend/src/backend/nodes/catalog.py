from backend.nodes import NODE_CLASSES
from backend.nodes.base import BaseNode
from backend.schemas.node_types import NodeTypeSchema


def node_type_descriptor(cls: type[BaseNode]) -> NodeTypeSchema:
    return NodeTypeSchema(
        type=cls.type,
        version=cls.version,
        label=cls.label,
        category=cls.category,
        icon=cls.icon,
        outputs=list(cls.outputs),
        config_schema=cls.ConfigModel.model_json_schema(),
    )


def list_node_types() -> list[NodeTypeSchema]:
    return [node_type_descriptor(node_cls) for node_cls in NODE_CLASSES]
