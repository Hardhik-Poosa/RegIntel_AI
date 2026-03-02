"""phase6_continuous_compliance_platform

Revision ID: d4f6h8j0l2n4
Revises: c3e5g7i9k1m3
Create Date: 2026-03-02 09:00:00.000000

Phase 6 tables:
  - compliance_monitors  (automated check results)
  - vendors              (third-party vendor risk)
  - compliance_alerts    (system + AI-generated alerts)
"""
from typing import Sequence, Union
from alembic import op


revision: str = 'd4f6h8j0l2n4'
down_revision: Union[str, None] = 'c3e5g7i9k1m3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── compliance_monitors ────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS compliance_monitors (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            control_id       UUID REFERENCES controls(id) ON DELETE CASCADE,
            check_type       VARCHAR(64)  NOT NULL DEFAULT 'MANUAL',
            status           VARCHAR(16)  NOT NULL DEFAULT 'PASS',
            message          TEXT,
            details          TEXT
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_compliance_monitors_org ON compliance_monitors (organization_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_compliance_monitors_ctrl ON compliance_monitors (control_id)")

    # ── vendors ────────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS vendors (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            name             VARCHAR(256) NOT NULL,
            category         VARCHAR(128),
            website          VARCHAR(512),
            description      TEXT,
            risk_level       VARCHAR(16)  NOT NULL DEFAULT 'MEDIUM',
            review_status    VARCHAR(32)  NOT NULL DEFAULT 'PENDING',
            notes            TEXT
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_vendors_org ON vendors (organization_id)")

    # ── compliance_alerts ──────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS compliance_alerts (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            control_id       UUID REFERENCES controls(id) ON DELETE SET NULL,
            severity         VARCHAR(16)  NOT NULL DEFAULT 'HIGH',
            category         VARCHAR(64),
            message          TEXT         NOT NULL,
            acknowledged     BOOLEAN      NOT NULL DEFAULT false
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_compliance_alerts_org ON compliance_alerts (organization_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_compliance_alerts_ack ON compliance_alerts (acknowledged)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS compliance_alerts")
    op.execute("DROP TABLE IF EXISTS vendors")
    op.execute("DROP TABLE IF EXISTS compliance_monitors")
