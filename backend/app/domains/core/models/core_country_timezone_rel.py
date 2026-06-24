from sqlmodel import SQLModel, Field


class CoreCountryTimezoneRel(SQLModel, table=True):
    __tablename__ = "core_country_timezone_rel"

    country_id: int = Field(foreign_key="core_countries.id", primary_key=True)
    timezone_id: int = Field(foreign_key="core_timezones.id", primary_key=True)
