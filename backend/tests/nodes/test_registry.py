import pytest

from backend.nodes import NODE_REGISTRY, get_node_class
from backend.nodes.condition import ConditionNode
from backend.nodes.llm import LlmConfig, LlmNode


PALETTE_NODE_TYPES = (
    "trigger",
    "llm",
    "agent",
    "condition",
    "http",
    "approval",
    "notify",
)


def test_registry_contains_all_palette_node_types() -> None:
    assert set(NODE_REGISTRY) == set(PALETTE_NODE_TYPES)


def test_get_node_class_returns_matching_class() -> None:
    assert get_node_class("llm") is LlmNode


def test_get_node_class_unknown_type_raises() -> None:
    with pytest.raises(ValueError, match="Unknown node type"):
        get_node_class("not-a-node")


def test_node_metadata_matches_ui_labels() -> None:
    for node_type in PALETTE_NODE_TYPES:
        cls = get_node_class(node_type)
        assert cls.type == node_type
        assert cls.label
        assert cls.ConfigModel is not None


def test_condition_node_has_yes_no_outputs() -> None:
    assert ConditionNode.outputs == ["yes", "no"]


def test_llm_config_validates_frontend_shape() -> None:
    cfg = LlmConfig.model_validate(
        {
            "credential_label": "My OpenAI key",
            "model": "gpt-4o-mini",
            "prompt": "Hello",
            "structured_output": True,
        }
    )
    assert cfg.structured_output is True


def test_build_returns_callable_that_preserves_state() -> None:
    node = LlmNode()
    fn = node.build(LlmConfig(model="gpt-4o-mini"), None)
    state = {"foo": "bar"}
    assert fn(state) == state
