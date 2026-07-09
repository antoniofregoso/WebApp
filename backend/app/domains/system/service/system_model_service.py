import uuid as uuid_lib
from datetime import date, datetime
from enum import Enum
from uuid import UUID

from sqlalchemy import inspect

from app.core.exceptions import ResourceNotFoundException
from app.domains.system.models.system_model import (
    SystemModel,
    SystemModelField,
    SystemModelSchema,
    SystemModelSchemaUse,
)
from app.domains.system.repository.system_model_repository import (
    MODEL_CLASS_BY_NAME,
    SystemModelRepository,
)

MODEL_NAME_BY_CLASS = {cls: name for name, cls in MODEL_CLASS_BY_NAME.items()}
RELATION_FIELD_TYPES = {"many2one", "many2one_avatar"}


def _schema_payload(schema) -> list[dict]:
    payload = getattr(schema, "schema", None)
    if callable(payload):
        payload = None
    if payload is None:
        payload = getattr(schema, "view", None)
    if isinstance(payload, dict) and set(payload) == {"schema"}:
        payload = payload["schema"]
    return payload or []


def _schema_field_names(schema: list[dict]) -> list[str]:
    field_names: list[str] = []
    for field in schema:
        name = field.get("name")
        if name and name not in field_names:
            field_names.append(name)
    return field_names


def _relation_map(model: str, schema: list[dict]) -> dict[str, str]:
    """Map FK columns (e.g. "company_id") to their relationship attribute
    (e.g. "company") for many2one/many2one_avatar schema fields, so records
    can embed the related {uuid, name, model} instead of the raw id."""
    model_class = MODEL_CLASS_BY_NAME.get(model)
    if model_class is None:
        return {}

    relationships = {relation.key for relation in inspect(model_class).relationships}
    mapping: dict[str, str] = {}
    for field in schema:
        field_name = field.get("name", "")
        if field.get("type") not in RELATION_FIELD_TYPES:
            continue
        if not field_name.endswith("_id"):
            continue
        attr_name = field_name[:-3]
        if attr_name in relationships:
            mapping[field_name] = attr_name
    return mapping


def _serialize_value(value):
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, list):
        return [_serialize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _serialize_value(item) for key, item in value.items()}
    if hasattr(value, "__mapper__"):
        return _serialize_related_record(value)
    return value


def _serialize_related_record(record) -> dict:
    payload = {}
    for column in record.__mapper__.column_attrs:
        if column.key == "id":
            continue
        key = (
            "schema"
            if isinstance(record, SystemModelSchema) and column.key == "view"
            else column.key
        )
        payload[key] = _serialize_value(getattr(record, column.key, None))
    return payload


def _display_name(related):
    for method_name in ("get_label", "get_name"):
        method = getattr(related, method_name, None)
        if callable(method):
            value = method()
            if value:
                return value
    name = getattr(related, "name", None)
    if isinstance(name, dict):
        return name.get("es") or name.get("en") or next(iter(name.values()), "")
    if name:
        return name
    return str(getattr(related, "uuid", ""))


def _serialize_many2one(related) -> dict:
    payload = {
        "uuid": _serialize_value(getattr(related, "uuid", None)),
        "name": _display_name(related),
        "model": MODEL_NAME_BY_CLASS.get(type(related)),
    }
    avatar = getattr(related, "avatar_url", None)
    if avatar:
        payload["avatar"] = avatar
    return payload


def _serialize_record(
    record, field_names: list[str], relation_map: dict[str, str] | None = None
) -> dict:
    relation_map = relation_map or {}
    result = {}
    for field_name in field_names:
        relation_attr = relation_map.get(field_name)
        if relation_attr:
            related = getattr(record, relation_attr, None)
            result[field_name] = (
                _serialize_many2one(related) if related is not None else None
            )
        else:
            result[field_name] = _serialize_value(getattr(record, field_name, None))
    return result


class SystemModelService:
    @staticmethod
    async def create(model_data: dict):
        fields_data = model_data.pop("fields", [])
        schemas_data = model_data.pop("schemas", [])
        system_model = SystemModel(**model_data)
        system_model.fields = [
            SystemModelField(**field_data) for field_data in fields_data
        ]
        system_model.schemas = [
            SystemModelSchema(**schema_data) for schema_data in schemas_data
        ]
        return await SystemModelRepository.create(system_model)

    @staticmethod
    async def get_all():
        return await SystemModelRepository.get_all()

    @staticmethod
    async def get_by_uuid(model_uuid: uuid_lib.UUID):
        system_model = await SystemModelRepository.get_by_uuid(model_uuid)
        if not system_model:
            raise ResourceNotFoundException(
                resource="SystemModel", resource_id=str(model_uuid)
            )
        return system_model

    @staticmethod
    async def get_by_name(name: str):
        system_model = await SystemModelRepository.get_by_name(name)
        if not system_model:
            raise ResourceNotFoundException(resource="SystemModel", resource_id=name)
        return system_model

    @staticmethod
    async def get_view(model: str, use: SystemModelSchemaUse, name: str):
        system_model, schema = await SystemModelRepository.get_view_definition(
            model, use, name
        )
        if not system_model:
            raise ResourceNotFoundException(resource="SystemModel", resource_id=model)
        if not schema:
            raise ResourceNotFoundException(
                resource="SystemModelSchema",
                resource_id=f"{model}/{use.value}/{name}",
            )

        schema_fields = _schema_payload(schema)
        field_names = _schema_field_names(schema_fields)
        if system_model.group_by and system_model.group_by not in field_names:
            field_names.append(system_model.group_by)

        relation_map = _relation_map(model, schema_fields)
        records = await SystemModelRepository.get_records(
            model, field_names, list(relation_map.values())
        )
        model_payload = {
            "name": system_model.name,
            "label": system_model.label,
            "groupBy": system_model.group_by,
        }
        if system_model.group_by:
            model_payload[system_model.group_by] = system_model.group_by_values
        model_payload["tags"] = system_model.tags
        model_payload["schema"] = schema_fields

        return {
            "model": model_payload,
            "records": [
                _serialize_record(record, field_names, relation_map)
                for record in records
            ],
        }

    @staticmethod
    async def update(model_uuid: uuid_lib.UUID, model_data: dict):
        system_model = await SystemModelRepository.update(model_uuid, model_data)
        if not system_model:
            raise ResourceNotFoundException(
                resource="SystemModel", resource_id=str(model_uuid)
            )
        return system_model

    @staticmethod
    async def delete(model_uuid: uuid_lib.UUID):
        deleted = await SystemModelRepository.delete(model_uuid)
        if not deleted:
            raise ResourceNotFoundException(
                resource="SystemModel", resource_id=str(model_uuid)
            )
        return True
