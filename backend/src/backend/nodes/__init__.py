from backend.nodes.agent import AgentConfig, AgentNode
from backend.nodes.approval import ApprovalConfig, ApprovalNode
from backend.nodes.base import BaseNode, NodeFn, NodeState
from backend.nodes.condition import ConditionConfig, ConditionNode
from backend.nodes.http import HttpConfig, HttpNode
from backend.nodes.llm import LlmConfig, LlmNode
from backend.nodes.notify import NotifyConfig, NotifyNode
from backend.nodes.trigger import TriggerConfig, TriggerNode

NODE_CLASSES: tuple[type[BaseNode], ...] = (
    TriggerNode,
    LlmNode,
    AgentNode,
    ConditionNode,
    HttpNode,
    ApprovalNode,
    NotifyNode,
)

NODE_REGISTRY: dict[str, type[BaseNode]] = {cls.type: cls for cls in NODE_CLASSES}


def get_node_class(node_type: str) -> type[BaseNode]:
    try:
        return NODE_REGISTRY[node_type]
    except KeyError:
        raise ValueError(f"Unknown node type: {node_type}") from None


__all__ = [
    "AgentConfig",
    "AgentNode",
    "ApprovalConfig",
    "ApprovalNode",
    "BaseNode",
    "ConditionConfig",
    "ConditionNode",
    "HttpConfig",
    "HttpNode",
    "LlmConfig",
    "LlmNode",
    "NODE_CLASSES",
    "NODE_REGISTRY",
    "NodeFn",
    "NodeState",
    "NotifyConfig",
    "NotifyNode",
    "TriggerConfig",
    "TriggerNode",
    "get_node_class",
]
