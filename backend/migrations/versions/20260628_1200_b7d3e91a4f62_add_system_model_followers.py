"""add system model followers

Revision ID: b7d3e91a4f62
Revises: a1f4c8e2d701
Create Date: 2026-06-28 12:00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "b7d3e91a4f62"
down_revision: Union[str, None] = "a1f4c8e2d701"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "system_model_followers",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("create_by", sa.Integer(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("model_id", sa.Integer(), nullable=False),
        sa.Column("record_uuid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["create_by"], ["user_user.id"]),
        sa.ForeignKeyConstraint(["model_id"], ["system_models.id"]),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["user_user.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["updated_by"], ["user_user.id"]),
        sa.PrimaryKeyConstraint("user_id", "model_id", "record_uuid"),
    )
    op.create_index(
        "ix_system_model_followers_record",
        "system_model_followers",
        ["model_id", "record_uuid"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_system_model_followers_record",
        table_name="system_model_followers",
    )
    op.drop_table("system_model_followers")
