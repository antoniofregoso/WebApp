from typing import Optional
import enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import text as sa_text
import sqlalchemy as sa
from sqlmodel import Field, Column, Relationship, SQLModel
import uuid

from app.domains.core.models.core_audit import CoreAudit


class FieldType(str, enum.Enum):
    string = "string"
    integer = "integer"
    decimal = "decimal"
    monetary = "monetary"
    percentage = "percentage"
    date = "date"
    datetime = "datetime"
    boolean = "boolean"
    image = "image"
    text = "text"
    html = "html"
    many2one = "many2one"
    many2one_avatar = "many2one_avatar"
    many2many = "many2many"
    many2many_pills = "many2many_pills"
    one2many = "one2many"

class CoreModel(CoreAudit, SQLModel, table=True):
    __tablename__ = "core_models"

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
    fields: list["CoreModelField"] = Relationship(
        back_populates="model",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    schemas: list["CoreModelSchema"] = Relationship(
        back_populates="model",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class CoreModelField(CoreAudit, SQLModel, table=True):
    __tablename__ = "core_model_fields"

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
    sequence: Optional[int] = Field(default=10)
    type: FieldType = Field(
        default=FieldType.string,
        sa_column=sa.Column(sa.String(32), nullable=False),
    )
    required: bool = Field(default=False)
    readonly: bool = Field(default=False)
    placeholder: dict = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
    )
    help: dict = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
    )
    model_id: int = Field(foreign_key="core_models.id")
    model: CoreModel = Relationship(back_populates="fields")

    def get_placeholder(self, lang: str = "es", fallback: str = "en") -> str:
        return self.placeholder.get(lang) or self.placeholder.get(fallback) or next(iter(self.placeholder.values()), "")
    
    def get_help(self, lang: str = "es", fallback: str = "en") -> str:
        return self.help.get(lang) or self.help.get(fallback) or next(iter(self.help.values()), "")
    
class CoreModelSchema(CoreAudit, SQLModel, table=True):
    __tablename__ = "core_model_schemas"

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
    use: str
    view: dict = Field(
        default_factory=dict,
        sa_column=Column(JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
    )
    model_id: int = Field(foreign_key="core_models.id")
    model: CoreModel = Relationship(back_populates="schemas")
