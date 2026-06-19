from enum import Enum
from sqlmodel import SQLModel, Field
from sqlalchemy import text as sa_text
from typing import Optional
from pydantic import EmailStr, constr
import uuid


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
