def test_list_workflows_requires_auth(client) -> None:
    response = client.get("/api/v1/workflows")

    assert response.status_code == 401


def test_list_workflows_returns_only_current_user(auth_client) -> None:
    first = auth_client.post("/api/v1/workflows", json={"name": "Alpha"})
    second = auth_client.post("/api/v1/workflows", json={"name": "Beta"})
    assert first.status_code == 201
    assert second.status_code == 201

    response = auth_client.get("/api/v1/workflows")

    assert response.status_code == 200
    body = response.json()
    assert len(body["workflows"]) == 2
    names = {item["name"] for item in body["workflows"]}
    assert names == {"Alpha", "Beta"}


def test_patch_workflow_updates_name(auth_client) -> None:
    created = auth_client.post("/api/v1/workflows", json={"name": "Before"})
    workflow_id = created.json()["id"]

    response = auth_client.patch(
        f"/api/v1/workflows/{workflow_id}",
        json={"name": "After"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "After"


def test_create_workflow_requires_auth(client) -> None:
    response = client.post("/api/v1/workflows", json={"name": "Untitled workflow"})

    assert response.status_code == 401


def test_create_workflow_returns_draft_with_empty_graph(auth_client) -> None:
    response = auth_client.post("/api/v1/workflows", json={"name": "Untitled workflow"})

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "draft"
    assert body["name"] == "Untitled workflow"
    assert body["graph"] == {"nodes": [], "edges": []}
    assert body["version"] == 1


def test_patch_workflow_updates_graph(auth_client) -> None:
    created = auth_client.post("/api/v1/workflows", json={"name": "Draft"})
    workflow_id = created.json()["id"]

    response = auth_client.patch(
        f"/api/v1/workflows/{workflow_id}",
        json={
            "graph": {
                "nodes": [{"id": "n1", "type": "workflow", "data": {}, "position": {"x": 1, "y": 2}}],
                "edges": [],
            },
        },
    )

    assert response.status_code == 200
    assert len(response.json()["graph"]["nodes"]) == 1


def test_get_workflow_returns_404_for_other_user(client, auth_client, register_payload) -> None:
    created = auth_client.post("/api/v1/workflows", json={"name": "Private"})
    workflow_id = created.json()["id"]

    client.post(
        "/api/v1/auth/register",
        json={**register_payload, "email": "other@example.com"},
    )
    from backend.core.cookies import ACCESS_TOKEN_COOKIE_NAME

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "other@example.com", "password": register_payload["password"]},
    )
    client.cookies.set(ACCESS_TOKEN_COOKIE_NAME, login.cookies[ACCESS_TOKEN_COOKIE_NAME])

    response = client.get(f"/api/v1/workflows/{workflow_id}")

    assert response.status_code == 404