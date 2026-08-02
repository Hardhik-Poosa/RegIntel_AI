"""phase6a_compliance_jobs

Revision ID: e5g7i9k1m3o5
Revises: d4f6h8j0l2n4
Create Date: 2026-08-02 21:30:00.000000

Phase 6A tables:
  - compliance_jobs (tracks execution history of automated compliance monitoring runs)
"""
from typing import Sequence, Union
from alembic import op


revision: str = 'e5g7i9k1m3o5'
down_revision: Union[str, None] = 'd4f6h8j0l2n4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS compliance_jobs (
            id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            trigger_type     VARCHAR(32) NOT NULL DEFAULT 'NIGHTLY_CRON',
            status           VARCHAR(32) NOT NULL DEFAULT 'PENDING',
            total_checks     INTEGER NOT NULL DEFAULT 0,
            passed_checks    INTEGER NOT NULL DEFAULT 0,
            failed_checks    INTEGER NOT NULL DEFAULT 0,
            error_log        TEXT,
            started_at       TIMESTAMPTZ,
            completed_at     TIMESTAMPTZ
        );
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_compliance_jobs_organization_id ON compliance_jobs(organization_id);
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS compliance_jobs CASCADE;")
