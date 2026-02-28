"""
Tests for GET /api/v1/dashboard/
"""

import pytest


DASHBOARD_URL = "/api/v1/dashboard/"


class TestDashboard:
    async def test_dashboard_requires_auth(self, client):
        resp = await client.get(DASHBOARD_URL)
        assert resp.status_code == 401

    async def test_dashboard_returns_expected_keys(self, client, auth_headers):
        resp = await client.get(DASHBOARD_URL, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        # Core metric keys that the frontend depends on
        assert "compliance_score" in data
        assert "total_controls" in data
        assert "implemented" in data
        assert "partial" in data
        assert "missing" in data

    async def test_dashboard_empty_org(self, client, auth_headers):
        """Fresh org with no controls should return zeros."""
        resp = await client.get(DASHBOARD_URL, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_controls"] == 0
        assert data["compliance_score"] == 0

    async def test_dashboard_counts_after_control_create(self, client, auth_headers):
        """After creating a control the total_controls should increase."""
        before = (await client.get(DASHBOARD_URL, headers=auth_headers)).json()

        await client.post(
            "/api/v1/controls/",
            json={
                "title": "Test Control",
                "description": "desc",
                "status": "IMPLEMENTED",
                "risk_score": "LOW",
            },
            headers=auth_headers,
        )

        after = (await client.get(DASHBOARD_URL, headers=auth_headers)).json()
        assert after["total_controls"] == before["total_controls"] + 1
        assert after["implemented"] == before["implemented"] + 1
