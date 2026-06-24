from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB

from app.core.models.core_audit import CoreAudit


class CurrencyPosition(str, Enum):
    BEFORE = "BEFORE"
    AFTER = "AFTER"


class CoreCurrency(CoreAudit, SQLModel, table=True):
    __tablename__ = "core_currencies"

    id: Optional[int] = Field(default=None, primary_key=True, nullable=False)
    name: str
    code: str
    iso_numeric: int
    symbol: str
    currency_unit_label: Optional[dict] = Field(default=None, sa_type=JSONB)
    currency_subunit_label: Optional[dict] = Field(default=None, sa_type=JSONB)
    rounding: float = Field(default=0.01)
    position: CurrencyPosition = Field(
        default=CurrencyPosition.BEFORE,
        sa_type=SAEnum(
            CurrencyPosition,
            name="currency_position",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
    )
    active: bool = Field(default=False)
