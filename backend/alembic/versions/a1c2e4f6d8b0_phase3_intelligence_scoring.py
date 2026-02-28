"""phase3_intelligence_scoring

Adds AI-analysis columns to controls and creates the
compliance_snapshots table for trend tracking.

Revision ID: a1c2e4f6d8b0
Revises: ee56b74bcdb7
Create Date: 2026-03-01 00:00:00.000000
"""
from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = 'a1c2e4f6d8b0'
down_revision: Union[str, Sequence[str], None] = 'ee56b74bcdb7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── New columns on controls (IF NOT EXISTS to survive partial runs) ──────
    op.execute("ALTER TABLE controls ADD COLUMN IF NOT EXISTS ai_suggested_risk VARCHAR")
    op.execute("ALTER TABLE controls ADD COLUMN IF NOT EXISTS ai_category VARCHAR")
    op.execute("ALTER TABLE controls ADD COLUMN IF NOT EXISTS ai_confidence FLOAT")

    # ── New table: compliance_snapshots ──────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS compliance_snapshots (
            id UUID PRIMARY KEY,
            created_at TIMESTAMPTZ,
            updated_at TIMESTAMPTZ,
            organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            score INTEGER NOT NULL
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_compliance_snapshots_organization_id "
        "ON compliance_snapshots (organization_id)"
    )


def downgrade() -> None:
    op.drop_index('ix_compliance_snapshots_organization_id', table_name='compliance_snapshots')
    op.drop_table('compliance_snapshots')
    op.drop_column('controls', 'ai_confidence')
    op.drop_column('controls', 'ai_category')
    op.drop_column('controls', 'ai_suggested_risk')
