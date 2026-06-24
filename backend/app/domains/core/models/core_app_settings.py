from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel

from app.domains.core.models.core_audit import CoreAudit

if TYPE_CHECKING:
    from app.domains.core.models.core_app import CoreApp


class CoreAppSettings(CoreAudit, SQLModel, table=True):
    __tablename__ = "core_app_settings"
    __table_args__ = (
        UniqueConstraint("app_id", "key", name="uq_core_app_settings_app_key"),
        Index("ix_core_app_settings_app_id", "app_id"),
        Index("ix_core_app_settings_key", "key"),
    )

    id: Optional[int] = Field(default=None, primary_key=True, nullable=False)
    app_id: int = Field(foreign_key="core_apps.id")
    key: str = Field(index=True)
    value: Any = Field(default=None, sa_type=JSONB)
    app: "CoreApp" = Relationship(back_populates="settings_ids")


from app.domains.core.models.core_app import CoreApp  
