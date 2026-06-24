from typing import Optional
from sqlmodel import Field, SQLModel


class CoreMessageUserRel(SQLModel, table=True):
    __tablename__ = "core_message_user_rel"

    message_id: Optional[int] = Field(default=None, foreign_key="core_messages.id", primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user_user.id", primary_key=True)
