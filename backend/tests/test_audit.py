"""
Tests for GET /api/v1/audit/
"""

import pytest


AUDIT_URL = "/api/v1/audit/"


class TestAuditLogs:
    async def test_audit_requires_auth(self, client):
        resp = await client.get(AUDIT_URL)
        assert resp.status_code == 401

    async def test_audit_returns_list(self, client, auth_headers):
        resp = await client.get(AUDIT_URL, headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_audit_log_created_on_control_create(self, client, auth_headers):
        """Creating a control must produce an audit log entry."""
        before = (await client.get(AUDIT_URL, headers=auth_headers)).json()

        await client.post(
            "/api/v1/controls/",
            json={
                "title": "Audit Test Control",
                "description": "description",
                "status": "MISSING",
                "risk_score": "HIGH",
            },
            headers=auth_headers,
        )

        after = (await client.get(AUDIT_URL, headers=auth_headers)).json()
        assert len(after) > len(before)

        # The most-recent entry should reference a CREATE action on a CONTROL
        latest = after[0]
        assert latest["action"].upper() == "CREATE"
        assert latest["entity_type"].upper() == "CONTROL"

    async def test_audit_log_on_control_delete(self, client, auth_headers):
        """Deleting a control must also be audited."""
        created = (
            await client.post(
                "/api/v1/controls/",
                json={
                    "title": "Delete Audit Control",
                    "description": "",
                    "status": "PARTIAL",
                    "risk_score": "MEDIUM",
                },
                headers=auth_headers,
            )
        ).json()

        before = (await client.get(AUDIT_URL, headers=auth_headers)).json()

        await client.delete(f"/api/v1/controls/{created['id']}", headers=auth_headers)

        after = (await client.get(AUDIT_URL, headers=auth_headers)).json()
        actions = [e["action"].upper() for e in after]
        assert "DELETE" in actions

    async def test_audit_pagination(self, client, auth_headers):
        """Limit and skip query params should work."""
        resp = await client.get(AUDIT_URL + "?limit=1&skip=0", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) <= 1
