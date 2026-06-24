from typing import TYPE_CHECKING, Optional

from sqlalchemy import Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel

from app.domains.core.models.core_audit import CoreAudit

if TYPE_CHECKING:
    from app.domains.core.models.core_app_settings import CoreAppSettings


class CoreApp(CoreAudit, SQLModel, table=True):
    __tablename__ = "core_apps"
    __table_args__ = (
        Index("ix_core_apps_keys_gin", "keys", postgresql_using="gin"),
    )

    id: Optional[int] = Field(default=None, primary_key=True, nullable=False)
    name: dict[str, str] = Field(default_factory=dict, sa_type=JSONB)
    description: dict[str, str] = Field(default_factory=dict, sa_type=JSONB)
    keys: Optional[dict] = Field(default=None, sa_type=JSONB)
    active: bool = Field(default=True)
    public: bool = Field(default=True)
    schema_org: Optional[dict] = Field(default=None, sa_type=JSONB)
    settings_ids: list["CoreAppSettings"] = Relationship(back_populates="app")


from app.domains.core.models.core_app_settings import CoreAppSettings  # noqa: E402
