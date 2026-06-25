from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from app.domains.system.models.system_audit import SystemAudit
from app.domains.system.models.system_country_timezone_rel import SystemCountryTimezoneRel

if TYPE_CHECKING:
    from app.domains.system.models.system_country import SystemCountry


class SystemTimezone(SystemAudit, SQLModel, table=True):
    __tablename__ = "system_timezones"

    id: Optional[int] = Field(default=None, primary_key=True, nullable=False)
    name: str
    code: str = Field(index=True, unique=True)
    offset: Optional[int] = Field(default=0)
    countries: list["SystemCountry"] = Relationship(
        back_populates="timezones",
        link_model=SystemCountryTimezoneRel,
    )
