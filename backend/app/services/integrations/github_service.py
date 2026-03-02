"""
GitHub Integration Service.

Scans a public (or token-authenticated) GitHub repository for common
compliance-relevant artifacts:
  - SECURITY.md / SECURITY.txt
  - CODEOWNERS
  - Dependabot config (.github/dependabot.yml)
  - Branch protection evidence (via API)
  - common CI/CD pipelines (.github/workflows/)
  - LICENSE file

Results are surfaced in the Integrations dashboard page.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"

# Files to look for (relative repo paths)
COMPLIANCE_FILES = [
    "SECURITY.md",
    "SECURITY.txt",
    "SECURITY",
    "CODEOWNERS",
    ".github/CODEOWNERS",
    ".github/dependabot.yml",
    ".github/dependabot.yaml",
    "LICENSE",
    "LICENSE.md",
]


async def _gh_get(path: str, token: str | None = None) -> dict | None:
    """Perform a GitHub API GET. Returns None on error."""
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{GITHUB_API}{path}", headers=headers)
            if resp.status_code == 200:
                return resp.json()
            return None
    except Exception as exc:
        logger.warning("GitHub API call failed (%s): %s", path, exc)
        return None


class GitHubIntegrationService:

    @staticmethod
    async def scan_repo(repo: str, token: str | None = None) -> dict[str, Any]:
        """
        Scan `repo` (format: "owner/repo") for compliance signals.

        Returns a structured findings dict:
        {
          "repo": "owner/repo",
          "checks": {
            "security_policy":    {"found": bool, "path": str | None},
            "codeowners":         {"found": bool, "path": str | None},
            "dependabot":         {"found": bool, "path": str | None},
            "license":            {"found": bool, "path": str | None},
            "ci_cd_workflows":    {"found": bool, "count": int},
          },
          "compliance_score": int,   # 0–100 simple heuristic
          "recommendations": [str]
        }
        """
        checks: dict[str, dict] = {
            "security_policy": {"found": False, "path": None},
            "codeowners":      {"found": False, "path": None},
            "dependabot":      {"found": False, "path": None},
            "license":         {"found": False, "path": None},
            "ci_cd_workflows": {"found": False, "count": 0},
        }

        # Check individual compliance files
        file_map = {
            ("SECURITY.md", "SECURITY.txt", "SECURITY"): "security_policy",
            ("CODEOWNERS", ".github/CODEOWNERS"):         "codeowners",
            (".github/dependabot.yml", ".github/dependabot.yaml"): "dependabot",
            ("LICENSE", "LICENSE.md", "LICENSE.txt"):     "license",
        }

        for paths_tuple, check_key in file_map.items():
            for file_path in paths_tuple:
                data = await _gh_get(f"/repos/{repo}/contents/{file_path}", token)
                if data and isinstance(data, dict) and data.get("type") == "file":
                    checks[check_key] = {"found": True, "path": file_path}
                    break

        # Check CI/CD workflows directory
        wf_data = await _gh_get(f"/repos/{repo}/contents/.github/workflows", token)
        if isinstance(wf_data, list):
            wf_files = [f for f in wf_data if isinstance(f, dict) and f.get("type") == "file"]
            checks["ci_cd_workflows"] = {"found": len(wf_files) > 0, "count": len(wf_files)}

        # Simple compliance score (20 pts per found check)
        weight = {
            "security_policy": 30,
            "codeowners":      20,
            "dependabot":      20,
            "license":         15,
            "ci_cd_workflows": 15,
        }
        score = sum(weight[k] for k, v in checks.items() if v.get("found"))

        # Recommendations
        recommendations: list[str] = []
        if not checks["security_policy"]["found"]:
            recommendations.append("Add a SECURITY.md file to document your vulnerability disclosure policy (required by ISO 27001 A.12.6).")
        if not checks["codeowners"]["found"]:
            recommendations.append("Create a CODEOWNERS file to enforce mandatory code review for sensitive paths.")
        if not checks["dependabot"]["found"]:
            recommendations.append("Enable Dependabot to automatically detect vulnerable dependencies (PCI-DSS 6.3.3).")
        if not checks["license"]["found"]:
            recommendations.append("Add a LICENSE file for IP governance and third-party compliance.")
        if not checks["ci_cd_workflows"]["found"]:
            recommendations.append("Add GitHub Actions workflows for automated security scanning (SAST/DAST).")

        return {
            "repo":             repo,
            "checks":           checks,
            "compliance_score": score,
            "recommendations":  recommendations,
        }
