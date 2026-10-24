from backend.core.cookies import ACCESS_TOKEN_COOKIE_NAME


def test_register_creates_user(client, register_payload) -> None:
    response = client.post("/api/v1/auth/register", json=register_payload)

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == register_payload["email"]
    assert body["first_name"] == register_payload["first_name"]
    assert "id" in body


def test_register_duplicate_email_returns_409(client, register_payload) -> None:
    client.post("/api/v1/auth/register", json=register_payload)
    response = client.post("/api/v1/auth/register", json=register_payload)

    assert response.status_code == 409
    assert response.json()["detail"] == "An account with this email already exists"


def test_login_sets_cookie_and_returns_user(client, register_payload) -> None:
    client.post("/api/v1/auth/register", json=register_payload)
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": register_payload["email"],
            "password": register_payload["password"],
        },
    )

    assert response.status_code == 200
    assert ACCESS_TOKEN_COOKIE_NAME in response.cookies
    assert response.json()["user"]["email"] == register_payload["email"]


def test_login_wrong_password_returns_401(client, register_payload) -> None:
    client.post("/api/v1/auth/register", json=register_payload)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_me_returns_current_user_when_authenticated(client, register_payload) -> None:
    client.post("/api/v1/auth/register", json=register_payload)
    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": register_payload["email"],
            "password": register_payload["password"],
        },
    )
    client.cookies.set(ACCESS_TOKEN_COOKIE_NAME, login.cookies[ACCESS_TOKEN_COOKIE_NAME])

    response = client.get("/api/v1/auth/me")

    assert response.status_code == 200
    assert response.json()["email"] == register_payload["email"]


def test_me_returns_401_without_cookie(client) -> None:
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_logout_clears_access_token_cookie(client, register_payload) -> None:
    client.post("/api/v1/auth/register", json=register_payload)
    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": register_payload["email"],
            "password": register_payload["password"],
        },
    )
    client.cookies.set(ACCESS_TOKEN_COOKIE_NAME, login.cookies[ACCESS_TOKEN_COOKIE_NAME])

    response = client.post("/api/v1/auth/logout")

    assert response.status_code == 204
    set_cookie = response.headers.get("set-cookie", "")
    assert ACCESS_TOKEN_COOKIE_NAME in set_cookie
