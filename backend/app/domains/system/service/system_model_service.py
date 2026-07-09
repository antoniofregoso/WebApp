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
MODEL_NAME_BY_TABLE = {
    cls.__tablename__: name for name, cls in MODEL_CLASS_BY_NAME.items()
}
RELATION_FIELD_TYPES = {"many2one", "many2one_avatar"}
FOLLOWERS_FIELD_NAME = "followers"


def _with_locale_aliases(value):
    if isinstance(value, list):
        return [_with_locale_aliases(item) for item in value]
    if not isinstance(value, dict):
        return value

    result = {key: _with_locale_aliases(item) for key, item in value.items()}
    if "es_MX" in result and "es" not in result:
        result["es"] = result["es_MX"]
    if "en_US" in result and "en" not in result:
        result["en"] = result["en_US"]
    return result


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


def _infer_relation_model(model: str, field_name: str) -> str | None:
    model_class = MODEL_CLASS_BY_NAME.get(model)
    if model_class is None:
        return None

    column = inspect(model_class).columns.get(field_name)
    if column is None:
        return None

    for foreign_key in column.foreign_keys:
        return MODEL_NAME_BY_TABLE.get(foreign_key.column.table.name)
    return None


def _schema_with_relation_models(model: str, schema: list[dict]) -> list[dict]:
    fields: list[dict] = []
    for field in schema:
        if field.get("type") not in RELATION_FIELD_TYPES or field.get("model"):
            fields.append(field)
            continue

        related_model = _infer_relation_model(model, field.get("name", ""))
        fields.append({**field, "model": related_model} if related_model else field)
    return fields


def _schema_with_default_followers_field(schema: list[dict], options: list[dict]) -> list[dict]:
    if any(field.get("type") == "one2many_followers" for field in schema):
        return [
            {**field, "options": options}
            if field.get("type") == "one2many_followers"
            else field
            for field in schema
        ]
    return [
        *schema,
        {
            "name": FOLLOWERS_FIELD_NAME,
            "type": "one2many_followers",
            "label": {"es_MX": "Seguidores", "en_US": "Followers"},
            "form": {"footer": "left"},
            "options": options,
        },
    ]


def _relation_model_map(
    schema: list[dict], relation_map: dict[str, str]
) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for field in schema:
        field_name = field.get("name", "")
        related_model = field.get("model")
        if (
            field.get("type") in RELATION_FIELD_TYPES
            and field_name.endswith("_id")
            and related_model
            and field_name not in relation_map
        ):
            mapping[field_name] = related_model
    return mapping


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
    payload["display_name"] = _display_name(record)
    payload["model"] = MODEL_NAME_BY_CLASS.get(type(record))
    return payload


def _localized_dict_value(value: dict) -> str:
    for key in ("es", "es_MX", "en", "en_US"):
        if value.get(key):
            return value[key]
    return next((item for item in value.values() if item), "")


def _display_name(related):
    for method_name in ("get_label", "get_name"):
        method = getattr(related, method_name, None)
        if callable(method):
            try:
                value = method("es_MX", "en_US")
            except TypeError:
                value = method()
            if value:
                return value
    name = getattr(related, "name", None)
    if isinstance(name, dict):
        return _localized_dict_value(name)
    if name:
        return name
    for attr_name in ("label", "title", "code", "email"):
        value = getattr(related, attr_name, None)
        if isinstance(value, dict):
            value = _localized_dict_value(value)
        if value:
            return value
    return str(getattr(related, "uuid", ""))


def _serialize_many2one(related) -> dict:
    display_name = _display_name(related)
    payload = {
        "uuid": _serialize_value(getattr(related, "uuid", None)),
        "name": display_name,
        "display_name": display_name,
        "model": MODEL_NAME_BY_CLASS.get(type(related)),
    }
    avatar = getattr(related, "avatar_url", None)
    if avatar:
        payload["avatar"] = avatar
    return payload


def _serialize_follower(user) -> dict:
    return {
        "uuid": _serialize_value(getattr(user, "uuid", None)),
        "name": _display_name(user),
        "display_name": _display_name(user),
        "email": str(getattr(user, "email", "")) or None,
        "avatar": getattr(user, "avatar_url", None),
        "user_type": _serialize_value(getattr(user, "user_type", None)),
        "model": "user.user",
    }


USER_SCOPED_MODELS = {"system.task", "system.message"}


def _belongs_to_user(model: str, record, current_user_id: int) -> bool:
    if model == "system.task":
        return getattr(record, "user_id", None) == current_user_id
    if model == "system.message":
        if getattr(record, "from_user_id", None) == current_user_id:
            return True
        return any(
            getattr(recipient, "id", None) == current_user_id
            for recipient in (getattr(record, "to_users", None) or [])
        )
    return True


def _serialize_record(
    record,
    field_names: list[str],
    relation_map: dict[str, str] | None = None,
    relation_model_map: dict[str, str] | None = None,
    related_lookup: dict[tuple[str, int], object] | None = None,
    followers_lookup: dict[str, list[dict]] | None = None,
) -> dict:
    relation_map = relation_map or {}
    relation_model_map = relation_model_map or {}
    related_lookup = related_lookup or {}
    followers_lookup = followers_lookup or {}
    result = {}
    for field_name in field_names:
        if field_name == FOLLOWERS_FIELD_NAME:
            result[field_name] = followers_lookup.get(str(getattr(record, "uuid", "")), [])
            continue
        relation_attr = relation_map.get(field_name)
        if relation_attr:
            related = getattr(record, relation_attr, None)
            result[field_name] = (
                _serialize_many2one(related) if related is not None else None
            )
        elif field_name in relation_model_map:
            related_id = getattr(record, field_name, None)
            related = related_lookup.get((relation_model_map[field_name], related_id))
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
    async def get_view(
        model: str,
        use: SystemModelSchemaUse,
        name: str,
        current_user_id: int | None = None,
    ):
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

        followable_users = await SystemModelRepository.get_followable_users()
        followable_by_id = {user.id: user for user in followable_users}
        follower_options = [_serialize_follower(user) for user in followable_users]
        schema_fields = _schema_with_default_followers_field(
            _schema_with_relation_models(model, _schema_payload(schema)),
            follower_options,
        )
        field_names = _schema_field_names(schema_fields)
        if system_model.group_by and system_model.group_by not in field_names:
            field_names.append(system_model.group_by)

        relation_map = _relation_map(model, schema_fields)
        records = await SystemModelRepository.get_records(
            model, field_names, list(relation_map.values())
        )
        if model in USER_SCOPED_MODELS and current_user_id is not None:
            records = [
                record for record in records
                if _belongs_to_user(model, record, current_user_id)
            ]
        relation_model_map = _relation_model_map(schema_fields, relation_map)
        ids_by_model: dict[str, set[int]] = {}
        for record in records:
            for field_name, related_model in relation_model_map.items():
                related_id = getattr(record, field_name, None)
                if related_id is not None:
                    ids_by_model.setdefault(related_model, set()).add(related_id)

        related_lookup = {}
        for related_model, record_ids in ids_by_model.items():
            related_records = await SystemModelRepository.get_records_by_ids(
                related_model, record_ids
            )
            related_lookup.update(
                ((related_model, record_id), related_record)
                for record_id, related_record in related_records.items()
            )
        record_uuids = {
            getattr(record, "uuid")
            for record in records
            if getattr(record, "uuid", None) is not None
        }
        followers_by_record = await SystemModelRepository.get_followers_by_record(
            system_model.id,
            record_uuids,
        )
        followers_lookup = {}
        for record in records:
            record_uuid = str(getattr(record, "uuid", ""))
            users_by_uuid = {
                str(user.uuid): user
                for user in followers_by_record.get(record_uuid, [])
            }
            creator = followable_by_id.get(getattr(record, "create_by", None))
            if creator is not None:
                users_by_uuid.setdefault(str(creator.uuid), creator)
            followers_lookup[record_uuid] = [
                _serialize_follower(user)
                for user in users_by_uuid.values()
            ]
        model_payload = {
            "name": system_model.name,
            "label": _with_locale_aliases(system_model.label),
            "groupBy": system_model.group_by,
        }
        if system_model.group_by:
            model_payload[system_model.group_by] = _with_locale_aliases(
                system_model.group_by_values
            )
        model_payload["tags"] = _with_locale_aliases(system_model.tags)
        model_payload["schema"] = _with_locale_aliases(schema_fields)

        return {
            "model": model_payload,
            "records": [
                _serialize_record(
                    record,
                    field_names,
                    relation_map,
                    relation_model_map,
                    related_lookup,
                    followers_lookup,
                )
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
