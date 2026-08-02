"""phase6a_operational_intelligence

Revision ID: f6a8b0c2d4e6
Revises: e5g7i9k1m3o5
Create Date: 2026-08-02 23:00:00.000000

Phase 6A Operational Intelligence tables:
  - compliance_changes
  - cloud_assets
  - monitoring_rules
  - compliance_scans
  - compliance_alerts (columns: title, status, assigned_to)
"""
from typing import Sequence, Union
from alembic import op


revision: str = 'f6a8b0c2d4e6'
down_revision: Union[str, None] = 'e5g7i9k1m3o5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. compliance_changes
    op.execute("""
        CREATE TABLE IF NOT EXISTS compliance_changes (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            control_id       UUID REFERENCES controls(id) ON DELETE SET NULL,
            change_type      VARCHAR(64) NOT NULL,
            old_value        TEXT,
            new_value        TEXT,
            severity         VARCHAR(16) NOT NULL DEFAULT 'HIGH',
            detected_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            resolved_at      TIMESTAMPTZ
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_compliance_changes_org_id ON compliance_changes(organization_id);")

    # 2. cloud_assets
    op.execute("""
        CREATE TABLE IF NOT EXISTS cloud_assets (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            provider         VARCHAR(32) NOT NULL,
            asset_type       VARCHAR(64) NOT NULL,
            name             VARCHAR(256) NOT NULL,
            owner            VARCHAR(128),
            risk_level       VARCHAR(16) NOT NULL DEFAULT 'LOW',
            last_seen        TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_cloud_assets_org_id ON cloud_assets(organization_id);")

    # 3. monitoring_rules
    op.execute("""
        CREATE TABLE IF NOT EXISTS monitoring_rules (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            rule_name        VARCHAR(128) NOT NULL,
            condition_type   VARCHAR(64) NOT NULL,
            severity         VARCHAR(16) NOT NULL DEFAULT 'HIGH',
            enabled          BOOLEAN NOT NULL DEFAULT true,
            description      TEXT
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_monitoring_rules_org_id ON monitoring_rules(organization_id);")

    # 4. compliance_scans
    op.execute("""
        CREATE TABLE IF NOT EXISTS compliance_scans (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            scan_type        VARCHAR(64) NOT NULL,
            status           VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
            items_scanned    INTEGER NOT NULL DEFAULT 0,
            failures_found   INTEGER NOT NULL DEFAULT 0,
            duration_seconds DOUBLE PRECISION NOT NULL DEFAULT 0.0,
            started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            completed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_compliance_scans_org_id ON compliance_scans(organization_id);")

    # 5. compliance_alerts columns
    op.execute("ALTER TABLE compliance_alerts ADD COLUMN IF NOT EXISTS title VARCHAR(256);")
    op.execute("ALTER TABLE compliance_alerts ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'OPEN';")
    op.execute("ALTER TABLE compliance_alerts ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS compliance_scans CASCADE;")
    op.execute("DROP TABLE IF EXISTS monitoring_rules CASCADE;")
    op.execute("DROP TABLE IF EXISTS cloud_assets CASCADE;")
    op.execute("DROP TABLE IF EXISTS compliance_changes CASCADE;")
