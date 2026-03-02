"""phase4_framework_engine

Adds:
- compliance_frameworks table
- framework_id FK on controls
- ai_status column on controls  (pending / processing / done / failed)
- plan_tier, ai_calls_used, controls_limit on organizations

Revision ID: b2d4f6a8c0e2
Revises: a1c2e4f6d8b0
Create Date: 2026-03-02 00:00:00.000000
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = 'b2d4f6a8c0e2'
down_revision: Union[str, Sequence[str], None] = 'a1c2e4f6d8b0'
branch_labels = None
depends_on = None


def upgrade() -> None:

    # ── 1. Compliance Frameworks table ───────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS frameworks (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            name        VARCHAR     NOT NULL UNIQUE,
            category    VARCHAR     NOT NULL,
            description TEXT
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_frameworks_category ON frameworks (category)"
    )

    # ── 2. framework_id FK on controls ───────────────────────────────────────
    op.execute(
        "ALTER TABLE controls ADD COLUMN IF NOT EXISTS "
        "framework_id UUID REFERENCES frameworks(id) ON DELETE SET NULL"
    )

    # ── 3. ai_status column on controls ──────────────────────────────────────
    op.execute(
        "ALTER TABLE controls ADD COLUMN IF NOT EXISTS "
        "ai_status VARCHAR NOT NULL DEFAULT 'pending'"
    )
    # Back-fill existing rows:
    # Controls that already have ai_analysis = done, those without = pending
    op.execute(
        "UPDATE controls SET ai_status = 'done' WHERE ai_analysis IS NOT NULL"
    )
    op.execute(
        "UPDATE controls SET ai_status = 'pending' WHERE ai_analysis IS NULL"
    )

    # ── 4. SaaS billing fields on organizations ───────────────────────────────
    op.execute(
        "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS "
        "plan_tier VARCHAR NOT NULL DEFAULT 'starter'"
    )
    op.execute(
        "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS "
        "ai_calls_used INTEGER NOT NULL DEFAULT 0"
    )
    op.execute(
        "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS "
        "controls_limit INTEGER NOT NULL DEFAULT 50"
    )


def downgrade() -> None:
    # Billing fields
    op.execute("ALTER TABLE organizations DROP COLUMN IF EXISTS controls_limit")
    op.execute("ALTER TABLE organizations DROP COLUMN IF EXISTS ai_calls_used")
    op.execute("ALTER TABLE organizations DROP COLUMN IF EXISTS plan_tier")

    # ai_status
    op.execute("ALTER TABLE controls DROP COLUMN IF EXISTS ai_status")

    # framework_id FK
    op.execute("ALTER TABLE controls DROP COLUMN IF EXISTS framework_id")

    # frameworks table
    op.execute("DROP INDEX IF EXISTS ix_frameworks_category")
    op.execute("DROP TABLE IF EXISTS frameworks")
