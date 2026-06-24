from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from app.core.models.core_audit import CoreAudit
from app.core.models.core_country_timezone_rel import CoreCountryTimezoneRel

if TYPE_CHECKING:
    from app.core.models.core_country import CoreCountry


class CoreTimezone(CoreAudit, SQLModel, table=True):
    __tablename__ = "core_timezones"

    id: Optional[int] = Field(default=None, primary_key=True, nullable=False)
    name: str
    code: str = Field(index=True, unique=True)
    offset: Optional[int] = Field(default=0)
    countries: list["CoreCountry"] = Relationship(
        back_populates="timezones",
        link_model=CoreCountryTimezoneRel,
    )
