"""
AI Policy Generator Service.

Generates compliance policy documents using the LLM.
Supported policy types match standard fintech/AI governance requirements.
"""
from __future__ import annotations

import logging

from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

POLICY_TEMPLATES: dict[str, str] = {
    "data_protection": "Data Protection & Privacy Policy",
    "access_control": "Access Control Policy",
    "incident_response": "Incident Response Policy",
    "business_continuity": "Business Continuity & Disaster Recovery Policy",
    "vendor_management": "Third-Party Vendor Management Policy",
    "ai_governance": "AI Governance & Ethics Policy",
    "change_management": "Change Management Policy",
    "vulnerability_management": "Vulnerability Management Policy",
}


class PolicyService:

    @staticmethod
    def available_types() -> list[dict]:
        return [{"id": k, "name": v} for k, v in POLICY_TEMPLATES.items()]

    @staticmethod
    async def generate(
        policy_type: str,
        organization_name: str,
        industry: str = "FinTech",
        jurisdiction: str = "India",
    ) -> str:
        """
        Generate a full policy document using the LLM.
        Returns the policy as a Markdown string.
        """
        human_name = POLICY_TEMPLATES.get(policy_type, policy_type.replace("_", " ").title())

        prompt = f"""Generate a professional, comprehensive {human_name} for the following organisation.

Organisation: {organization_name}
Industry: {industry}
Primary Jurisdiction: {jurisdiction}

The policy MUST include all of these sections with proper headings:

1. **Purpose** — why this policy exists
2. **Scope** — who and what it applies to
3. **Definitions** — key terms
4. **Policy Statement** — the core rules and requirements (detailed, specific)
5. **Roles & Responsibilities** — who is accountable for what
6. **Procedures** — step-by-step operational instructions
7. **Compliance & Enforcement** — consequences of non-compliance
8. **Review Cycle** — when and how the policy is reviewed
9. **References** — relevant regulations (RBI, DPDP Act, PCI-DSS, ISO 27001, etc. as applicable)

Write it in formal policy language. Be specific and actionable.
Use proper Markdown formatting with headings, bullet points, and numbered lists.
The policy should be approximately 800-1200 words."""

        system_prompt = (
            "You are a senior compliance officer and legal expert specialising in FinTech, "
            "cybersecurity, and AI governance. Generate professional compliance policy documents "
            "in formal language. Always cite real regulation names and article numbers when applicable."
        )

        try:
            return await AIService.chat(prompt, system_prompt=system_prompt)
        except Exception as exc:
            logger.error("Policy generation failed for %s: %s", policy_type, exc)
            return f"# {human_name}\n\n*Policy generation failed. Please check AI service configuration.*\n\nError: {exc}"
