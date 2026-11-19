PALETTE_NODE_TYPES = [
    "trigger",
    "llm",
    "agent",
    "condition",
    "http",
    "approval",
    "notify",
]


def test_list_node_types_returns_200_and_ordered_catalog(client) -> None:
    response = client.get("/api/v1/node-types")

    assert response.status_code == 200
    body = response.json()
    assert "node_types" in body
    types = [item["type"] for item in body["node_types"]]
    assert types == PALETTE_NODE_TYPES


def test_condition_node_type_includes_yes_no_outputs(client) -> None:
    response = client.get("/api/v1/node-types")
    condition = next(n for n in response.json()["node_types"] if n["type"] == "condition")

    assert condition["outputs"] == ["yes", "no"]
    assert "properties" in condition["config_schema"]
