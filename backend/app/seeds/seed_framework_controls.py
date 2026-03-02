"""
Seed FrameworkControl template rows for all 8 frameworks.

Run once:
    cd backend
    conda run -n py2 python -m app.seeds.seed_framework_controls
"""
from __future__ import annotations

import asyncio
import logging

from sqlalchemy.future import select

logger = logging.getLogger(__name__)

# ── Template definitions ───────────────────────────────────────────────────────
# Each entry: (framework_name, control_ref, title, risk_score, description, status_hint)
TEMPLATES: list[tuple] = [

    # ── RBI FinTech ──────────────────────────────────────────────────────────
    ("RBI FinTech Guidelines",
     "RBI-1.1", "Customer Data Localisation Policy",
     "HIGH", "Ensure all customer financial data is stored within India as per RBI circular.",
     "Check cloud S3/database region settings"),
    ("RBI FinTech Guidelines",
     "RBI-1.2", "API Security for Payment Systems",
     "HIGH", "Secure all payment APIs with OAuth 2.0, rate limiting, and mutual TLS.",
     "Review API gateway config"),
    ("RBI FinTech Guidelines",
     "RBI-2.1", "Incident Reporting to RBI",
     "HIGH", "Report cybersecurity incidents to RBI within 6 hours of detection.",
     "Check incident response runbook"),
    ("RBI FinTech Guidelines",
     "RBI-2.2", "Third-Party Risk Assessment",
     "MEDIUM", "Annual risk assessment of all critical third-party technology providers.",
     "Review vendor contracts & assessments"),
    ("RBI FinTech Guidelines",
     "RBI-3.1", "Business Continuity Plan (BCP)",
     "MEDIUM", "Maintain and test a BCP for payment processing infrastructure.",
     "Check BCP documentation & test records"),

    # ── PCI-DSS ──────────────────────────────────────────────────────────────
    ("PCI-DSS",
     "PCI-3.4", "Cardholder Data Encryption at Rest",
     "HIGH", "Encrypt all stored PAN data using AES-256 or equivalent strong cryptography.",
     "Audit database encryption settings"),
    ("PCI-DSS",
     "PCI-6.3.3", "Vulnerability Management — Patching",
     "HIGH", "Apply security patches within one month of release for all system components.",
     "Review patch management logs"),
    ("PCI-DSS",
     "PCI-8.3.6", "Multi-Factor Authentication",
     "HIGH", "Require MFA for all access to the cardholder data environment.",
     "Audit MFA configuration in IAM"),
    ("PCI-DSS",
     "PCI-10.2", "Audit Log Completeness",
     "MEDIUM", "Log all access to cardholder data and retain logs for at least 12 months.",
     "Check SIEM / log retention config"),
    ("PCI-DSS",
     "PCI-11.3.1", "External Penetration Testing",
     "MEDIUM", "Conduct external penetration testing at least annually and after major changes.",
     "Review pentest reports"),

    # ── SOC 2 Type II ─────────────────────────────────────────────────────────
    ("SOC 2 Type II",
     "SOC-CC6.1", "Logical Access Controls",
     "HIGH", "Implement role-based access control and least-privilege for all systems.",
     "Audit IAM roles & permissions"),
    ("SOC 2 Type II",
     "SOC-CC6.7", "Data Transmission Encryption",
     "HIGH", "Encrypt all data in transit using TLS 1.2+ for external communications.",
     "Check TLS certificates & config"),
    ("SOC 2 Type II",
     "SOC-CC7.2", "Security Incident Detection",
     "HIGH", "Implement real-time monitoring and alerting for security events.",
     "Review SIEM alerts & runbooks"),
    ("SOC 2 Type II",
     "SOC-A1.2", "Capacity and Performance Management",
     "MEDIUM", "Monitor and manage system capacity to ensure availability.",
     "Check cloud monitoring dashboards"),
    ("SOC 2 Type II",
     "SOC-PI1.2", "Processing Integrity Monitoring",
     "MEDIUM", "Monitor data processing jobs for errors and completeness.",
     "Review ETL / data pipeline logs"),

    # ── ISO 27001 ─────────────────────────────────────────────────────────────
    ("ISO 27001",
     "ISO-A.5.1", "Information Security Policies",
     "MEDIUM", "Establish, approve, and publish information security policies.",
     "Review policy document repository"),
    ("ISO 27001",
     "ISO-A.8.2", "Information Classification",
     "MEDIUM", "Classify all data assets by sensitivity (Public, Internal, Confidential, Secret).",
     "Check data inventory & classification labels"),
    ("ISO 27001",
     "ISO-A.9.1", "Access Control Policy",
     "HIGH", "Define and enforce access control rules based on business and security requirements.",
     "Review access control policy document"),
    ("ISO 27001",
     "ISO-A.12.6", "Technical Vulnerability Management",
     "HIGH", "Timely identification and remediation of technical vulnerabilities.",
     "Review vulnerability scanner reports"),
    ("ISO 27001",
     "ISO-A.17.1", "Business Continuity Planning",
     "MEDIUM", "Develop, implement, and test information security continuity plans.",
     "Review BCP test results"),

    # ── EU AI Act ─────────────────────────────────────────────────────────────
    ("EU AI Act",
     "EUAI-9", "Risk Management System for High-Risk AI",
     "HIGH", "Establish a continuous risk management system for the AI system lifecycle.",
     "Review AI risk register & mitigation records"),
    ("EU AI Act",
     "EUAI-10", "Governance of Training Data",
     "HIGH", "Ensure training data is relevant, representative, and free from harmful biases.",
     "Audit dataset cards & bias reports"),
    ("EU AI Act",
     "EUAI-13", "AI System Transparency",
     "MEDIUM", "Provide clear information to users that they are interacting with an AI system.",
     "Check UI disclosure notices"),
    ("EU AI Act",
     "EUAI-14", "Human Oversight Mechanism",
     "HIGH", "Enable human oversight: ability to stop, override, or intervene in AI outputs.",
     "Review human-in-the-loop processes"),
    ("EU AI Act",
     "EUAI-17", "Post-Market Monitoring",
     "MEDIUM", "Monitor AI system performance in production and report serious incidents.",
     "Check model monitoring dashboards"),

    # ── NIST AI RMF ───────────────────────────────────────────────────────────
    ("NIST AI RMF",
     "NIST-MAP-1", "AI Risk Context Mapping",
     "MEDIUM", "Identify and document intended use cases, stakeholders, and risk contexts.",
     "Review AI use-case documentation"),
    ("NIST AI RMF",
     "NIST-MEASURE-2", "AI Bias Testing",
     "HIGH", "Test AI models for performance disparities across demographic groups.",
     "Review bias evaluation reports"),
    ("NIST AI RMF",
     "NIST-MANAGE-3", "AI Incident Response",
     "HIGH", "Define and test AI-specific incident response procedures.",
     "Review AI incident runbook"),
    ("NIST AI RMF",
     "NIST-GOVERN-1", "AI Governance Policies",
     "MEDIUM", "Establish organisational policies and accountability structures for AI.",
     "Review AI governance charter"),

    # ── SEBI Algo Trading ─────────────────────────────────────────────────────
    ("SEBI Algo Trading Guidelines",
     "SEBI-AT-1", "Algorithm Approval and Audit Trail",
     "HIGH", "All trading algorithms must be approved by a certified exchage and maintain audit trails.",
     "Review algo approval records"),
    ("SEBI Algo Trading Guidelines",
     "SEBI-AT-2", "Kill Switch Mechanism",
     "HIGH", "Implement a kill switch to halt all algorithmic trading immediately.",
     "Test kill switch in UAT"),
    ("SEBI Algo Trading Guidelines",
     "SEBI-AT-3", "Order-to-Trade Ratio Controls",
     "MEDIUM", "Monitor and limit order-to-trade ratios to prevent market abuse.",
     "Review OTR monitoring config"),

    # ── DPDP Act 2023 ─────────────────────────────────────────────────────────
    ("DPDP Act 2023",
     "DPDP-1", "Data Fiduciary Registration",
     "HIGH", "Register as a Significant Data Fiduciary with the Data Protection Board if applicable.",
     "Check SDF applicability assessment"),
    ("DPDP Act 2023",
     "DPDP-2", "Consent Management System",
     "HIGH", "Implement a consent management platform for collecting, storing, and withdrawing user consent.",
     "Review consent records & withdrawal flows"),
    ("DPDP Act 2023",
     "DPDP-3", "Data Breach Notification",
     "HIGH", "Notify the Data Protection Board and affected users within 72 hours of a personal data breach.",
     "Review breach notification runbook"),
    ("DPDP Act 2023",
     "DPDP-4", "Children's Data Protection",
     "HIGH", "Obtain verifiable parental consent before processing data of children under 18.",
     "Audit age-verification and consent flows"),
    ("DPDP Act 2023",
     "DPDP-5", "Data Retention Limits",
     "MEDIUM", "Delete personal data once the purpose of collection is fulfilled.",
     "Review data retention & deletion policies"),
]


async def seed() -> None:
    from app.db.database import AsyncSessionLocal
    from app.models.framework import ComplianceFramework
    from app.models.framework_control import FrameworkControl

    async with AsyncSessionLocal() as session:
        # Build name → id map
        fw_result = await session.execute(select(ComplianceFramework))
        fw_map = {fw.name: fw.id for fw in fw_result.scalars().all()}

        added = 0
        for (fw_name, ref, title, risk, desc, hint) in TEMPLATES:
            fw_id = fw_map.get(fw_name)
            if not fw_id:
                logger.warning("Framework not found: %s — skipping", fw_name)
                continue

            # Idempotent: skip if control_ref already exists
            existing = await session.execute(
                select(FrameworkControl).where(
                    FrameworkControl.framework_id == fw_id,
                    FrameworkControl.control_ref == ref,
                )
            )
            if existing.scalars().first():
                continue

            session.add(FrameworkControl(
                framework_id = fw_id,
                control_ref  = ref,
                title        = title,
                risk_score   = risk,
                description  = desc,
                status_hint  = hint,
            ))
            added += 1

        await session.commit()
        print(f"✅  Seeded {added} framework control templates.")


if __name__ == "__main__":
    asyncio.run(seed())
