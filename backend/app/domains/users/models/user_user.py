from enum import Enum
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import text as sa_text
from typing import TYPE_CHECKING, List, Optional
from pydantic import EmailStr, constr
import uuid

if TYPE_CHECKING:
    from app.domains.core.models.core_message import CoreMessage
    from app.domains.core.models.core_notification import CoreNotification
    from app.domains.core.models.core_company import CoreCompany

from app.domains.core.models.core_message_user_rel import CoreMessageUserRel
from app.domains.core.models.core_notification_user_rel import CoreNotificationUserRel


class ThemeMode(str, Enum):
    light = "light"
    dark = "dark"
    system = "system"


class UserType(str, Enum):
    HUMAN = "HUMAN"
    SYSTEM = "SYSTEM"
    AIAGENT = "AIAGENT"


class UserUser(SQLModel, table=True):
    __tablename__ = "user_user"

    id: Optional[int] = Field(default=None, primary_key=True, nullable=False)
    uuid: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column_kwargs={
            "server_default": sa_text("gen_random_uuid()"),
            "unique": True,
        },
        index=True,
    )
    email: EmailStr = Field(unique=True, index=True)
    name: constr(min_length=2, max_length=100)
    password: constr(min_length=8)
    avatar_url: Optional[str] = None
    theme: ThemeMode = Field(default=ThemeMode.system)
    user_type: UserType = Field(default=UserType.HUMAN)
    active: bool = Field(default=True)
    company_id: Optional[int] = Field(default=None, foreign_key="core_companies.id", nullable=True)
    company: Optional["CoreCompany"] = Relationship(back_populates="users")

    # Messages sent by this user
    sent_messages: List["CoreMessage"] = Relationship(back_populates="from_user")

    # Messages received by this user
    received_messages: List["CoreMessage"] = Relationship(
        back_populates="to_users",
        link_model=CoreMessageUserRel,
    )

    # Notifications directed to this user (single target via user_id)
    notifications: List["CoreNotification"] = Relationship(back_populates="user")

    # Notifications where this user is one of many targets
    group_notifications: List["CoreNotification"] = Relationship(
        back_populates="users",
        link_model=CoreNotificationUserRel,
    )
