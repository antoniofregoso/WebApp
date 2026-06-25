from typing import TYPE_CHECKING, List, Optional
import uuid
from sqlalchemy import text as sa_text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel

from app.domains.system.models.system_audit import SystemAudit

if TYPE_CHECKING:
    from app.domains.users.models.user_user import UserUser




class SystemCompany(SystemAudit, SQLModel, table=True):
    __tablename__ = "system_companies"

    id: Optional[int] = Field(default=None, primary_key=True, nullable=False)
    uuid: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column_kwargs={
            "server_default": sa_text("gen_random_uuid()"),
            "unique": True,
        },
        index=True,
    )
    name: str
    active: bool = Field(default=False)
    sequence: Optional[int] = Field(default=10)
    currency_id: Optional[int] = Field(default=None, foreign_key="system_currencies.id")
    color: Optional[str] = None
    logo_url: Optional[str] = None
    street: Optional[str] = None
    street2: Optional[str] = None
    zip: Optional[str] = None
    city: Optional[str] = None
    state_id: Optional[int] = Field(default=None, foreign_key="system_country_states.id")
    country_id: Optional[int] = Field(default=None, foreign_key="system_countries.id")
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    vat: Optional[str] = None
    lang_id: Optional[int] = Field(default=None, foreign_key="system_langs.id")

    users: List["UserUser"] = Relationship(
        back_populates="company",
        sa_relationship_kwargs={"foreign_keys": "[UserUser.company_id]"},
    )
