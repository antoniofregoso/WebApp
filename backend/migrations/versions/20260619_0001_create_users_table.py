"""Create the initial user_user table.

Revision ID: 20260619_0001
Revises:
Create Date: 2026-06-19
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260619_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

theme_mode = postgresql.ENUM(
    "light", "dark", "system", name="thememode", create_type=False
)
user_type = postgresql.ENUM(
    "HUMAN", "SYSTEM", "AIAGENT", name="usertype", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    theme_mode.create(bind, checkfirst=True)
    user_type.create(bind, checkfirst=True)

    op.create_table(
        "user_user",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "uuid",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("password", sa.String(), nullable=False),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("theme", theme_mode, nullable=False),
        sa.Column("user_type", user_type, nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_user_user_email", "user_user", ["email"], unique=True
    )
    op.create_index(
        "ix_user_user_uuid", "user_user", ["uuid"], unique=True
    )


def downgrade() -> None:
    op.drop_index("ix_user_user_uuid", table_name="user_user")
    op.drop_index("ix_user_user_email", table_name="user_user")
    op.drop_table("user_user")

    user_type.drop(op.get_bind(), checkfirst=True)
    theme_mode.drop(op.get_bind(), checkfirst=True)
