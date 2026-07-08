import uuid as uuid_lib
from datetime import date, datetime
from enum import Enum
from uuid import UUID

from app.core.exceptions import ResourceNotFoundException
from app.domains.system.models.system_model import (
    SystemModel,
    SystemModelField,
    SystemModelSchema,
    SystemModelSchemaUse,
)
from app.domains.system.repository.system_model_repository import SystemModelRepository


def _schema_field_names(schema: list[dict]) -> list[str]:
    field_names: list[str] = []
    for field in schema:
        name = field.get("name")
        if name and name not in field_names:
            field_names.append(name)
    return field_names


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
        return [_serialize_related_record(item) for item in value]
    if isinstance(value, dict):
        return {key: _serialize_value(item) for key, item in value.items()}
    if hasattr(value, "__mapper__"):
        return _serialize_related_record(value)
    return value


def _serialize_related_record(record) -> dict:
    return {
        column.key: _serialize_value(getattr(record, column.key, None))
        for column in record.__mapper__.column_attrs
        if column.key != "id"
    }


def _serialize_record(record, field_names: list[str]) -> dict:
    return {
        field_name: _serialize_value(getattr(record, field_name, None))
        for field_name in field_names
    }


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

        schema_fields = schema.view or []
        field_names = _schema_field_names(schema_fields)
        if system_model.group_by and system_model.group_by not in field_names:
            field_names.append(system_model.group_by)

        records = await SystemModelRepository.get_records(model, field_names)
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
            "records": [_serialize_record(record, field_names) for record in records],
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
