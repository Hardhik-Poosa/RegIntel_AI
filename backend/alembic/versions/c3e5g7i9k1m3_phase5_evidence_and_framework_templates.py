"""phase5_evidence_and_framework_templates

Revision ID: c3e5g7i9k1m3
Revises: b2d4f6a8c0e2
Create Date: 2026-02-22 09:00:00.000000

Phase 5 changes:
  - New table: control_evidence  (uploaded proof files + AI scan results)
  - New table: framework_controls (pre-built control templates per framework)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PGUUID


# revision identifiers, used by Alembic.
revision: str = 'c3e5g7i9k1m3'
down_revision: Union[str, None] = 'b2d4f6a8c0e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── control_evidence ─────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS control_evidence (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

            control_id      UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
            uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,

            file_name       VARCHAR(512)  NOT NULL,
            file_url        VARCHAR(2048) NOT NULL,
            file_size       FLOAT,
            mime_type       VARCHAR(128),

            -- AI scanner results (NULL = not yet scanned)
            ai_valid        BOOLEAN,
            ai_confidence   FLOAT,
            ai_explanation  TEXT
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_control_evidence_control_id ON control_evidence (control_id)")

    # ── framework_controls ────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS framework_controls (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

            framework_id    UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,

            title           VARCHAR(255) NOT NULL,
            description     TEXT,
            risk_score      VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
            status_hint     VARCHAR(64),
            control_ref     VARCHAR(64)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_framework_controls_framework_id ON framework_controls (framework_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS control_evidence")
    op.execute("DROP TABLE IF EXISTS framework_controls")
