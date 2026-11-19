from backend.nodes.catalog import list_node_types

PALETTE_NODE_TYPES = (
    "trigger",
    "llm",
    "agent",
    "condition",
    "http",
    "approval",
    "notify",
)


def test_list_node_types_count_and_types() -> None:
    descriptors = list_node_types()
    assert len(descriptors) == 7
    assert [d.type for d in descriptors] == list(PALETTE_NODE_TYPES)


def test_each_descriptor_has_config_schema_properties() -> None:
    for descriptor in list_node_types():
        assert "properties" in descriptor.config_schema


def test_llm_config_schema_requires_model() -> None:
    llm = next(d for d in list_node_types() if d.type == "llm")
    assert "model" in llm.config_schema.get("required", [])
