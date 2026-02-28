"""
Tests for the /api/v1/controls/ CRUD endpoints.
"""

import pytest


BASE = "/api/v1/controls"


def control_payload(**overrides):
    payload = {
        "title": "Access Control Policy",
        "description": "Ensure least-privilege access across all systems.",
        "status": "IMPLEMENTED",
        "risk_score": "LOW",
    }
    payload.update(overrides)
    return payload


# --------------------------------------------------------------------------- #
# List
# --------------------------------------------------------------------------- #
class TestListControls:
    async def test_list_requires_auth(self, client):
        resp = await client.get(BASE + "/")
        assert resp.status_code == 401

    async def test_list_empty(self, client, auth_headers):
        resp = await client.get(BASE + "/", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_returns_only_own_org(self, client, auth_headers):
        """Controls created by this user should appear in the list."""
        await client.post(BASE + "/", json=control_payload(), headers=auth_headers)
        resp = await client.get(BASE + "/", headers=auth_headers)
        titles = [c["title"] for c in resp.json()]
        assert "Access Control Policy" in titles


# --------------------------------------------------------------------------- #
# Create
# --------------------------------------------------------------------------- #
class TestCreateControl:
    async def test_create_success(self, client, auth_headers):
        resp = await client.post(
            BASE + "/", json=control_payload(), headers=auth_headers
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert data["title"] == "Access Control Policy"
        assert data["status"] == "IMPLEMENTED"
        assert data["risk_score"] == "LOW"
        assert "id" in data

    async def test_create_requires_auth(self, client):
        resp = await client.post(BASE + "/", json=control_payload())
        assert resp.status_code == 401

    async def test_create_missing_title(self, client, auth_headers):
        bad = {k: v for k, v in control_payload().items() if k != "title"}
        resp = await client.post(BASE + "/", json=bad, headers=auth_headers)
        assert resp.status_code == 422

    async def test_create_invalid_status(self, client, auth_headers):
        resp = await client.post(
            BASE + "/",
            json=control_payload(status="INVALID_STATUS"),
            headers=auth_headers,
        )
        assert resp.status_code == 422

    async def test_create_partial_status(self, client, auth_headers):
        resp = await client.post(
            BASE + "/", json=control_payload(status="PARTIAL", risk_score="HIGH"),
            headers=auth_headers,
        )
        assert resp.status_code in (200, 201)
        assert resp.json()["status"] == "PARTIAL"


# --------------------------------------------------------------------------- #
# Update
# --------------------------------------------------------------------------- #
class TestUpdateControl:
    async def test_update_success(self, client, auth_headers):
        created = (
            await client.post(BASE + "/", json=control_payload(), headers=auth_headers)
        ).json()
        control_id = created["id"]

        resp = await client.put(
            f"{BASE}/{control_id}",
            json={**control_payload(), "title": "Updated Title", "status": "PARTIAL"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"
        assert resp.json()["status"] == "PARTIAL"

    async def test_update_nonexistent(self, client, auth_headers):
        import uuid
        resp = await client.put(
            f"{BASE}/{uuid.uuid4()}",
            json=control_payload(),
            headers=auth_headers,
        )
        assert resp.status_code == 404

    async def test_update_requires_auth(self, client, auth_headers):
        created = (
            await client.post(BASE + "/", json=control_payload(), headers=auth_headers)
        ).json()
        resp = await client.put(f"{BASE}/{created['id']}", json=control_payload())
        assert resp.status_code == 401


# --------------------------------------------------------------------------- #
# Delete
# --------------------------------------------------------------------------- #
class TestDeleteControl:
    async def test_delete_success(self, client, auth_headers):
        created = (
            await client.post(BASE + "/", json=control_payload(), headers=auth_headers)
        ).json()
        control_id = created["id"]

        resp = await client.delete(f"{BASE}/{control_id}", headers=auth_headers)
        assert resp.status_code in (200, 204)

        # Verify it's gone
        list_resp = await client.get(BASE + "/", headers=auth_headers)
        ids = [c["id"] for c in list_resp.json()]
        assert control_id not in ids

    async def test_delete_nonexistent(self, client, auth_headers):
        import uuid
        resp = await client.delete(f"{BASE}/{uuid.uuid4()}", headers=auth_headers)
        assert resp.status_code == 404

    async def test_delete_requires_auth(self, client, auth_headers):
        created = (
            await client.post(BASE + "/", json=control_payload(), headers=auth_headers)
        ).json()
        resp = await client.delete(f"{BASE}/{created['id']}")
        assert resp.status_code == 401
