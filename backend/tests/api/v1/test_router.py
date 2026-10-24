def test_api_v1_auth_routes_are_mounted(client) -> None:
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
