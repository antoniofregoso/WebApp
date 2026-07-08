import uuid as uuid_lib

from sqlalchemy import inspect, select
from sqlalchemy.orm import selectinload

from app.core.database.session import db
from app.domains.system.models import (
    SystemApp,
    SystemAppSettings,
    SystemCompany,
    SystemCountry,
    SystemCountryState,
    SystemCurrency,
    SystemLang,
    SystemMessage,
    SystemNotification,
    SystemTask,
    SystemTimezone,
    SystemWhatsApp,
    SystemWhatsAppMessage,
    SystemWhatsAppTemplate,
)
from app.domains.system.models.system_model import (
    SystemModel,
    SystemModelField,
    SystemModelSchema,
    SystemModelSchemaUse,
)
from app.domains.users.models import UserLog, UserUser

MODEL_CLASS_BY_NAME = {
    "system.app": SystemApp,
    "system.app.settings": SystemAppSettings,
    "system.company": SystemCompany,
    "system.country": SystemCountry,
    "system.country.state": SystemCountryState,
    "system.currency": SystemCurrency,
    "system.lan": SystemLang,
    "system.message": SystemMessage,
    "system.model": SystemModel,
    "system.notification": SystemNotification,
    "system.task": SystemTask,
    "system.timezone": SystemTimezone,
    "system.whatsapp": SystemWhatsApp,
    "system.whatsapp.message": SystemWhatsAppMessage,
    "system.whatsapp.template": SystemWhatsAppTemplate,
    "user.log": UserLog,
    "user.user": UserUser,
}


class SystemModelRepository:
    @staticmethod
    async def create(system_model: SystemModel):
        async with db.session() as session:
            session.add(system_model)
            await session.commit()
            await session.refresh(system_model)
            return await SystemModelRepository.get_by_uuid(system_model.uuid)

    @staticmethod
    async def get_all():
        async with db.session() as session:
            query = (
                select(SystemModel)
                .options(
                    selectinload(SystemModel.fields),
                    selectinload(SystemModel.schemas),
                )
                .order_by(SystemModel.name)
            )
            result = await session.execute(query)
            return result.scalars().all()

    @staticmethod
    async def get_by_uuid(model_uuid: uuid_lib.UUID):
        async with db.session() as session:
            query = (
                select(SystemModel)
                .where(SystemModel.uuid == model_uuid)
                .options(
                    selectinload(SystemModel.fields),
                    selectinload(SystemModel.schemas),
                )
            )
            result = await session.execute(query)
            return result.scalar_one_or_none()

    @staticmethod
    async def get_by_name(name: str):
        async with db.session() as session:
            query = (
                select(SystemModel)
                .where(SystemModel.name == name)
                .options(
                    selectinload(SystemModel.fields),
                    selectinload(SystemModel.schemas),
                )
            )
            result = await session.execute(query)
            return result.scalar_one_or_none()

    @staticmethod
    async def get_view_definition(
        model_name: str,
        use: SystemModelSchemaUse | str,
        schema_name: str,
    ):
        schema_use = use.value if isinstance(use, SystemModelSchemaUse) else use
        async with db.session() as session:
            query = (
                select(SystemModel)
                .where(SystemModel.name == model_name)
                .options(
                    selectinload(SystemModel.fields),
                    selectinload(SystemModel.schemas),
                )
            )
            result = await session.execute(query)
            system_model = result.scalar_one_or_none()
            if not system_model:
                return None, None

            schema = next(
                (
                    item
                    for item in system_model.schemas
                    if item.name == schema_name
                    and (
                        item.use.value
                        if isinstance(item.use, SystemModelSchemaUse)
                        else item.use
                    )
                    == schema_use
                ),
                None,
            )
            return system_model, schema

    @staticmethod
    async def get_records(model_name: str, field_names: list[str]) -> list:
        model_class = MODEL_CLASS_BY_NAME.get(model_name)
        if model_class is None:
            return []

        mapper = inspect(model_class)
        relationships = {relationship.key for relationship in mapper.relationships}
        options = [
            selectinload(getattr(model_class, field_name))
            for field_name in field_names
            if field_name in relationships
        ]

        async with db.session() as session:
            query = select(model_class).options(*options)
            if hasattr(model_class, "id"):
                query = query.order_by(model_class.id)
            result = await session.execute(query)
            return result.scalars().all()

    @staticmethod
    async def update(model_uuid: uuid_lib.UUID, model_data: dict):
        async with db.session() as session:
            query = (
                select(SystemModel)
                .where(SystemModel.uuid == model_uuid)
                .options(
                    selectinload(SystemModel.fields),
                    selectinload(SystemModel.schemas),
                )
            )
            result = await session.execute(query)
            system_model = result.scalar_one_or_none()
            if not system_model:
                return None

            fields_data = model_data.pop("fields", None)
            schemas_data = model_data.pop("schemas", None)

            for key, value in model_data.items():
                setattr(system_model, key, value)

            if fields_data is not None:
                system_model.fields = [
                    SystemModelField(**field_data) for field_data in fields_data
                ]

            if schemas_data is not None:
                system_model.schemas = [
                    SystemModelSchema(**schema_data) for schema_data in schemas_data
                ]

            session.add(system_model)
            await session.commit()
            await session.refresh(system_model)
            return await SystemModelRepository.get_by_uuid(system_model.uuid)

    @staticmethod
    async def delete(model_uuid: uuid_lib.UUID):
        async with db.session() as session:
            query = (
                select(SystemModel)
                .where(SystemModel.uuid == model_uuid)
                .options(
                    selectinload(SystemModel.fields),
                    selectinload(SystemModel.schemas),
                )
            )
            result = await session.execute(query)
            system_model = result.scalar_one_or_none()
            if not system_model:
                return False

            await session.delete(system_model)
            await session.commit()
            return True
