import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import text as sa_text
from sqlalchemy.dialects.postgresql import JSONB
import sqlalchemy as sa
from sqlmodel import Field, Relationship, Column, SQLModel

from app.domains.core.models.core_audit import CoreAudit
from app.domains.core.models.core_colors import CoreColor
from app.domains.core.models.core_notification_user_rel import CoreNotificationUserRel

if TYPE_CHECKING:
    from app.domains.users.models.user_user import UserUser


class CoreNotification(CoreAudit, SQLModel, table=True):
    __tablename__ = "core_notifications"

    id: Optional[int] = Field(default=None, primary_key=True, nullable=False)
    uuid: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column_kwargs={
            "server_default": sa_text("gen_random_uuid()"),
            "unique": True,
        },
        index=True,
    )
    title: dict = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
    )
    message: dict = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
    )
    read: bool = Field(default=True)
    color: CoreColor = Field(
        default=CoreColor.zinc,
        sa_column=sa.Column(sa.String(32), nullable=False),
    )

    # Single-user target
    user_id: Optional[int] = Field(default=None, foreign_key="user_user.id", nullable=True)
    user: Optional["UserUser"] = Relationship(
        back_populates="notifications",
        sa_relationship_kwargs={"foreign_keys": "[CoreNotification.user_id]"},
    )

    # Multi-user target
    users: List["UserUser"] = Relationship(
        back_populates="group_notifications",
        link_model=CoreNotificationUserRel,
    )

    def get_title(self, lang: str = "es", fallback: str = "en") -> str:
        return self.title.get(lang) or self.title.get(fallback) or next(iter(self.title.values()), "")

    def get_message(self, lang: str = "es", fallback: str = "en") -> str:
        return self.message.get(lang) or self.message.get(fallback) or next(iter(self.message.values()), "")
