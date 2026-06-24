from typing import Optional
from sqlmodel import SQLModel, Field 
from app.core.models.core_audit import CoreAudit   

class CoreLang(CoreAudit, SQLModel, table=True):
    __tablename__ = "core_langs"

    id: Optional[int] = Field(default=None, primary_key=True, nullable=False)
    name: str
    code: str = Field(unique=True, index=True)
    iso_code: str = Field(unique=True, index=True)
    url_code: str = Field(unique=True, index=True)
    date_format: Optional[str] = None
    time_format: Optional[str] = None
    week_start: Optional[int] = None
    flag: Optional[str] = None
    active: bool = Field(default=False)