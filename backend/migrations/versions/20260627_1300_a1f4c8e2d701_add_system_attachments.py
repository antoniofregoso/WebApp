"""add system attachments

Revision ID: a1f4c8e2d701
Revises:
Create Date: 2026-06-27 13:00:00

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a1f4c8e2d701"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "system_attachments",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("create_by", sa.Integer(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "uuid",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("model_id", sa.Integer(), nullable=False),
        sa.Column("record_uuid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=True),
        sa.Column("original_name", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=255), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=False),
        sa.Column("storage_provider", sa.String(length=32), nullable=False),
        sa.Column("storage_key", sa.String(length=512), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["system_companies.id"]),
        sa.ForeignKeyConstraint(["create_by"], ["user_user.id"]),
        sa.ForeignKeyConstraint(["model_id"], ["system_models.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["user_user.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(
        "ix_system_attachments_checksum_sha256",
        "system_attachments",
        ["checksum_sha256"],
    )
    op.create_index(
        "ix_system_attachments_record",
        "system_attachments",
        ["company_id", "model_id", "record_uuid"],
    )
    op.create_index(
        "ix_system_attachments_storage_key",
        "system_attachments",
        ["storage_key"],
    )
    op.create_index(
        "ix_system_attachments_uuid",
        "system_attachments",
        ["uuid"],
    )


def downgrade() -> None:
    op.drop_index("ix_system_attachments_uuid", table_name="system_attachments")
    op.drop_index("ix_system_attachments_storage_key", table_name="system_attachments")
    op.drop_index("ix_system_attachments_record", table_name="system_attachments")
    op.drop_index(
        "ix_system_attachments_checksum_sha256",
        table_name="system_attachments",
    )
    op.drop_table("system_attachments")
