from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, Column
import sqlalchemy as sa
from sqlalchemy import UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from app.domains.system.models.system_audit import SystemAudit
from app.domains.system.models.system_country_timezone_rel import SystemCountryTimezoneRel

if TYPE_CHECKING:
    from app.domains.system.models.system_timezone import SystemTimezone

class SystemCountry(SystemAudit, SQLModel, table=True):
    __tablename__ = "system_countries"

    id: Optional[int] = Field(default=None, primary_key=True, nullable=False)
    code: str = Field(unique=True, index=True)
    name: dict = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
    )

    phone_code: Optional[str] = None
    currency_id: Optional[int] = Field(default=None, foreign_key="system_currencies.id")
    states: list["SystemCountryState"] = Relationship()
    timezones: list["SystemTimezone"] = Relationship(
        back_populates="countries",
        link_model=SystemCountryTimezoneRel,
    )

    def get_name(self, lang: str = "es", fallback: str = "en") -> str:
        return self.name.get(lang) or self.name.get(fallback) or next(iter(self.name.values()), "")
    



class SystemCountryState(SQLModel, table=True):
    __tablename__ = "system_country_states"
    __table_args__ = (
        UniqueConstraint("country_id", "code", name="uq_country_state_country_code"),
    )

    id: Optional[int] = Field(default=None, primary_key=True, nullable=False)
    code: str = Field(index=True)
    name: dict = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
    )
    country_id: int = Field(foreign_key="system_countries.id")

    def get_name(self, lang: str = "es", fallback: str = "en") -> str:
        return self.name.get(lang) or self.name.get(fallback) or next(iter(self.name.values()), "")


from app.domains.system.models.system_timezone import SystemTimezone  # noqa: E402
