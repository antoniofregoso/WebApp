"""Add system WhatsApp configuration and messages.

Revision ID: 93f50b2df4d1
Revises: 6c18d90deafb
Create Date: 2026-07-01 22:10:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql


revision: str = "93f50b2df4d1"
down_revision: Union[str, None] = "6c18d90deafb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "system_whatsapp",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column("create_by", sa.Integer(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "uuid",
            sa.Uuid(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column(
            "phone_number",
            sqlmodel.sql.sqltypes.AutoString(length=32),
            nullable=False,
        ),
        sa.Column(
            "phone_number_id",
            sqlmodel.sql.sqltypes.AutoString(length=64),
            nullable=False,
        ),
        sa.Column(
            "business_account_id",
            sqlmodel.sql.sqltypes.AutoString(length=64),
            nullable=False,
        ),
        sa.Column(
            "api_version",
            sqlmodel.sql.sqltypes.AutoString(length=16),
            nullable=True,
        ),
        sa.Column("access_token", sa.Text(), nullable=True),
        sa.Column("verify_token", sa.Text(), nullable=True),
        sa.Column("app_secret", sa.Text(), nullable=True),
        sa.Column(
            "webhook_url",
            sqlmodel.sql.sqltypes.AutoString(length=512),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["company_id"],
            ["system_companies.id"],
            name="fk_system_whatsapp_company_id",
        ),
        sa.ForeignKeyConstraint(
            ["create_by"],
            ["user_user.id"],
            name="fk_system_whatsapp_create_by",
        ),
        sa.ForeignKeyConstraint(
            ["updated_by"],
            ["user_user.id"],
            name="fk_system_whatsapp_updated_by",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "company_id",
            "phone_number_id",
            name="uq_system_whatsapp_company_phone_number_id",
        ),
    )
    op.create_index(
        "ix_system_whatsapp_company_id",
        "system_whatsapp",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_system_whatsapp_uuid",
        "system_whatsapp",
        ["uuid"],
        unique=True,
    )

    op.create_table(
        "system_whatsapp_messages",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column("create_by", sa.Integer(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "uuid",
            sa.Uuid(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("whatsapp_id", sa.Integer(), nullable=False),
        sa.Column(
            "external_message_id",
            sqlmodel.sql.sqltypes.AutoString(length=255),
            nullable=True,
        ),
        sa.Column("model_id", sa.Integer(), nullable=True),
        sa.Column("record_uuid", sa.Uuid(), nullable=True),
        sa.Column(
            "direction",
            sa.String(length=16),
            server_default="outbound",
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=16),
            server_default="queued",
            nullable=False,
        ),
        sa.Column(
            "message_type",
            sqlmodel.sql.sqltypes.AutoString(length=32),
            nullable=False,
        ),
        sa.Column(
            "from_number",
            sqlmodel.sql.sqltypes.AutoString(length=32),
            nullable=False,
        ),
        sa.Column(
            "to_number",
            sqlmodel.sql.sqltypes.AutoString(length=32),
            nullable=False,
        ),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column(
            "payload",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "date",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["create_by"],
            ["user_user.id"],
            name="fk_system_whatsapp_messages_create_by",
        ),
        sa.ForeignKeyConstraint(
            ["model_id"],
            ["system_models.id"],
            name="fk_system_whatsapp_messages_model_id",
        ),
        sa.ForeignKeyConstraint(
            ["updated_by"],
            ["user_user.id"],
            name="fk_system_whatsapp_messages_updated_by",
        ),
        sa.ForeignKeyConstraint(
            ["whatsapp_id"],
            ["system_whatsapp.id"],
            name="fk_system_whatsapp_messages_whatsapp_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_system_whatsapp_messages_external_message_id",
        "system_whatsapp_messages",
        ["external_message_id"],
        unique=True,
    )
    op.create_index(
        "ix_system_whatsapp_messages_record",
        "system_whatsapp_messages",
        ["model_id", "record_uuid"],
        unique=False,
    )
    op.create_index(
        "ix_system_whatsapp_messages_uuid",
        "system_whatsapp_messages",
        ["uuid"],
        unique=True,
    )
    op.create_index(
        "ix_system_whatsapp_messages_whatsapp_id",
        "system_whatsapp_messages",
        ["whatsapp_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("system_whatsapp_messages")
    op.drop_table("system_whatsapp")
