import uuid as uuid_lib

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database.session import db
from app.domains.system.models.system_model import (
    SystemModel,
    SystemModelField,
    SystemModelSchema,
)


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
