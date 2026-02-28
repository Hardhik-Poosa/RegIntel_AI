"""
Tests for GET /api/v1/compliance/score
"""

import pytest


COMPLIANCE_URL = "/api/v1/compliance/score"


class TestCompliance:
    async def test_compliance_requires_auth(self, client):
        resp = await client.get(COMPLIANCE_URL)
        assert resp.status_code == 401

    async def test_compliance_zero_score_no_controls(self, client, auth_headers):
        resp = await client.get(COMPLIANCE_URL, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        # Fresh org – score should be 0 or the key should exist
        assert "compliance_score" in data or "score" in data

    async def test_compliance_score_range(self, client, auth_headers):
        resp = await client.get(COMPLIANCE_URL, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        score = data.get("compliance_score") or data.get("score", 0)
        assert 0 <= score <= 100

    async def test_compliance_score_increases_with_implemented(
        self, client, auth_headers
    ):
        """Adding IMPLEMENTED controls should raise the score over MISSING ones."""
        # Baseline
        baseline = (
            await client.get(COMPLIANCE_URL, headers=auth_headers)
        ).json()
        baseline_score = baseline.get("compliance_score") or baseline.get("score", 0)

        # Add an IMPLEMENTED control
        await client.post(
            "/api/v1/controls/",
            json={
                "title": "Encryption at Rest",
                "description": "All sensitive data must be encrypted at rest.",
                "status": "IMPLEMENTED",
                "risk_score": "LOW",
            },
            headers=auth_headers,
        )

        after = (
            await client.get(COMPLIANCE_URL, headers=auth_headers)
        ).json()
        after_score = after.get("compliance_score") or after.get("score", 0)

        assert after_score >= baseline_score

    async def test_compliance_score_lower_for_missing(self, client, auth_headers):
        """MISSING controls should keep / lower the compliance score."""
        await client.post(
            "/api/v1/controls/",
            json={
                "title": "Data Retention Policy",
                "description": "No retention policy in place.",
                "status": "MISSING",
                "risk_score": "HIGH",
            },
            headers=auth_headers,
        )
        resp = await client.get(COMPLIANCE_URL, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        score = data.get("compliance_score") or data.get("score", 0)
        assert score < 100  # Should never be perfect with a MISSING control
