from sqlmodel import SQLModel, Field
from sqlalchemy import text as sa_text
from typing import Optional
from pydantic import EmailStr, constr
import uuid


class Company(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True, nullable=False)
    uuid: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column_kwargs={
            "server_default": sa_text("gen_random_uuid()"),
            "unique": True,
        },
        index=True,
    )
    name: constr(min_length=2, max_length=100)
    sequence: Optional[int] = Field(default=10)
    logo_web: Optional[str] = None
    street: Optional[str] = None
    street2: Optional[str] = None
    city: Optional[str] = None
    state_id:
    country_id:
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    zip: Optional[str] = None
    vat: Optional[str] = None
    disabled: bool = Field(default=False)
