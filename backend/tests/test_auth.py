"""
Tests for POST /api/v1/auth/register and POST /api/v1/auth/login.
"""

import pytest


# --------------------------------------------------------------------------- #
# Registration
# --------------------------------------------------------------------------- #
class TestRegister:
    PAYLOAD = {
        "email": "newuser@example.com",
        "password": "SecurePass1!",
        "organization": {"name": "TestOrg", "industry": "Tech"},
    }

    async def test_register_success(self, client):
        resp = await client.post("/api/v1/auth/register", json=self.PAYLOAD)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == self.PAYLOAD["email"]
        assert "id" in data
        # Password must never be returned
        assert "password" not in data
        assert "hashed_password" not in data

    async def test_register_duplicate_email(self, client):
        """Second registration with the same email must return 400."""
        await client.post("/api/v1/auth/register", json=self.PAYLOAD)
        resp = await client.post("/api/v1/auth/register", json=self.PAYLOAD)
        assert resp.status_code == 400
        assert "already exists" in resp.json()["detail"].lower()

    async def test_register_missing_email(self, client):
        bad = {**self.PAYLOAD, "email": ""}
        resp = await client.post("/api/v1/auth/register", json=bad)
        assert resp.status_code == 422

    async def test_register_missing_password(self, client):
        bad = {k: v for k, v in self.PAYLOAD.items() if k != "password"}
        resp = await client.post("/api/v1/auth/register", json=bad)
        assert resp.status_code == 422


# --------------------------------------------------------------------------- #
# Login
# --------------------------------------------------------------------------- #
class TestLogin:
    async def test_login_success(self, client, registered_user):
        creds = registered_user["_credentials"]
        resp = await client.post(
            "/api/v1/auth/login",
            data={"username": creds["email"], "password": creds["password"]},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client, registered_user):
        creds = registered_user["_credentials"]
        resp = await client.post(
            "/api/v1/auth/login",
            data={"username": creds["email"], "password": "WrongPassword!"},
        )
        assert resp.status_code == 401

    async def test_login_unknown_email(self, client):
        resp = await client.post(
            "/api/v1/auth/login",
            data={"username": "nobody@nowhere.com", "password": "anything"},
        )
        assert resp.status_code == 401

    async def test_jwt_token_is_usable(self, client, registered_user, auth_headers):
        """A token obtained from login should authenticate /users/me."""
        resp = await client.get("/api/v1/users/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == registered_user["_credentials"]["email"]
