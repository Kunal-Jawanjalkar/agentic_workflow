def test_health_returns_ok(client) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_read_root_returns_message(client) -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World"}
