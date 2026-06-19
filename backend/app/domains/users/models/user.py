from sqlmodel import SQLModel, Field
from sqlalchemy import text as sa_text
from typing import Optional
from pydantic import EmailStr, constr
import uuid

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True, nullable=False)
    uuid: uuid.UUID = Field(default_factory=uuid.uuid4,  
        sa_column_kwargs={
            "server_default": sa_text("gen_random_uuid()"),  
            "unique": True
        },
        index=True
    )
    email: EmailStr = Field(unique=True, index=True)
    name: constr(min_length=2, max_length=100)
    password: constr(min_length=8)
    disabled: bool = Field(default=False)
