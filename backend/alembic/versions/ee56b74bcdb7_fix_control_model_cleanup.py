"""fix_control_model_cleanup

Revision ID: ee56b74bcdb7
Revises: b4a8b598e9ce
Create Date: 2026-02-21 03:08:22.735294

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ee56b74bcdb7'
down_revision: Union[str, Sequence[str], None] = 'b4a8b598e9ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create new enum types (IF NOT EXISTS in case a previous partial run left them)
    op.execute("DO $$ BEGIN CREATE TYPE control_status AS ENUM ('IMPLEMENTED', 'PARTIAL', 'MISSING'); EXCEPTION WHEN duplicate_object THEN NULL; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE control_risk AS ENUM ('LOW', 'MEDIUM', 'HIGH'); EXCEPTION WHEN duplicate_object THEN NULL; END $$")

    # Alter status column using USING cast
    op.execute(
        "ALTER TABLE controls ALTER COLUMN status TYPE control_status "
        "USING status::text::control_status"
    )
    op.execute("ALTER TABLE controls ALTER COLUMN status SET NOT NULL")

    # Alter risk_score column using USING cast
    op.execute(
        "ALTER TABLE controls ALTER COLUMN risk_score TYPE control_risk "
        "USING risk_score::text::control_risk"
    )
    op.execute("ALTER TABLE controls ALTER COLUMN risk_score SET NOT NULL")

    # Drop old enum types
    op.execute("DROP TYPE IF EXISTS controlstatus")
    op.execute("DROP TYPE IF EXISTS controlrisk")

    # Make compliance_score NOT NULL
    op.alter_column('controls', 'compliance_score',
               existing_type=sa.INTEGER(),
               nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('controls', 'compliance_score',
               existing_type=sa.INTEGER(),
               nullable=True)

    # Recreate old enum types
    op.execute("CREATE TYPE controlstatus AS ENUM ('IMPLEMENTED', 'PARTIAL', 'MISSING')")
    op.execute("CREATE TYPE controlrisk AS ENUM ('LOW', 'MEDIUM', 'HIGH')")

    op.execute(
        "ALTER TABLE controls ALTER COLUMN risk_score TYPE controlrisk "
        "USING risk_score::text::controlrisk"
    )
    op.execute(
        "ALTER TABLE controls ALTER COLUMN status TYPE controlstatus "
        "USING status::text::controlstatus"
    )

    op.execute("DROP TYPE IF EXISTS control_status")
    op.execute("DROP TYPE IF EXISTS control_risk")
