"""
Framework seeder — run once to populate the frameworks table.

Usage (from backend/ directory):
    conda run -n py2 python -m app.seeds.seed_frameworks
"""
import asyncio
from app.db.database import AsyncSessionLocal
from app.models.framework import ComplianceFramework
from sqlalchemy.future import select


FRAMEWORKS = [
    # ── FinTech ──────────────────────────────────────────────────────────────
    {
        "name": "RBI FinTech Guidelines",
        "category": "Financial",
        "description": (
            "Reserve Bank of India guidelines for FinTech companies covering "
            "data localisation, KYC, transaction monitoring, and cybersecurity."
        ),
    },
    {
        "name": "PCI-DSS",
        "category": "Financial",
        "description": (
            "Payment Card Industry Data Security Standard — requirements for "
            "organisations handling branded credit cards."
        ),
    },
    {
        "name": "SOC 2 Type II",
        "category": "Security",
        "description": (
            "AICPA trust service criteria covering security, availability, "
            "processing integrity, confidentiality, and privacy."
        ),
    },
    {
        "name": "ISO 27001",
        "category": "Security",
        "description": (
            "International standard for information security management systems (ISMS)."
        ),
    },
    # ── AI Governance ─────────────────────────────────────────────────────────
    {
        "name": "EU AI Act",
        "category": "AI Governance",
        "description": (
            "European Union regulation on artificial intelligence — risk-based "
            "approach classifying AI systems as unacceptable, high, limited, or minimal risk."
        ),
    },
    {
        "name": "NIST AI RMF",
        "category": "AI Governance",
        "description": (
            "NIST AI Risk Management Framework — voluntary framework for "
            "managing risks associated with AI systems across their lifecycle."
        ),
    },
    {
        "name": "SEBI Algo Trading Guidelines",
        "category": "Financial",
        "description": (
            "SEBI regulations for algorithmic trading systems, covering audit trails, "
            "risk controls, and real-time monitoring."
        ),
    },
    {
        "name": "DPDP Act 2023",
        "category": "Financial",
        "description": (
            "India's Digital Personal Data Protection Act — governs collection, "
            "storage and processing of personal digital data."
        ),
    },
]


async def seed():
    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(ComplianceFramework))).scalars().all()
        existing_names = {fw.name for fw in existing}

        added = 0
        for fw_data in FRAMEWORKS:
            if fw_data["name"] in existing_names:
                continue
            db.add(ComplianceFramework(**fw_data))
            added += 1

        await db.commit()
        print(f"Seeded {added} frameworks ({len(existing_names)} already existed).")


if __name__ == "__main__":
    asyncio.run(seed())
