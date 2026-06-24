import uuid as uuid_lib

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database.session import db
from app.domains.core.models.core_model import (
    CoreModel,
    CoreModelField,
    CoreModelSchema,
)


class CoreModelRepository:
    @staticmethod
    async def create(core_model: CoreModel):
        async with db.session() as session:
            session.add(core_model)
            await session.commit()
            await session.refresh(core_model)
            return await CoreModelRepository.get_by_uuid(core_model.uuid)

    @staticmethod
    async def get_all():
        async with db.session() as session:
            query = (
                select(CoreModel)
                .options(
                    selectinload(CoreModel.fields),
                    selectinload(CoreModel.schemas),
                )
                .order_by(CoreModel.name)
            )
            result = await session.execute(query)
            return result.scalars().all()

    @staticmethod
    async def get_by_uuid(model_uuid: uuid_lib.UUID):
        async with db.session() as session:
            query = (
                select(CoreModel)
                .where(CoreModel.uuid == model_uuid)
                .options(
                    selectinload(CoreModel.fields),
                    selectinload(CoreModel.schemas),
                )
            )
            result = await session.execute(query)
            return result.scalar_one_or_none()

    @staticmethod
    async def get_by_name(name: str):
        async with db.session() as session:
            query = (
                select(CoreModel)
                .where(CoreModel.name == name)
                .options(
                    selectinload(CoreModel.fields),
                    selectinload(CoreModel.schemas),
                )
            )
            result = await session.execute(query)
            return result.scalar_one_or_none()

    @staticmethod
    async def update(model_uuid: uuid_lib.UUID, model_data: dict):
        async with db.session() as session:
            query = (
                select(CoreModel)
                .where(CoreModel.uuid == model_uuid)
                .options(
                    selectinload(CoreModel.fields),
                    selectinload(CoreModel.schemas),
                )
            )
            result = await session.execute(query)
            core_model = result.scalar_one_or_none()
            if not core_model:
                return None

            fields_data = model_data.pop("fields", None)
            schemas_data = model_data.pop("schemas", None)

            for key, value in model_data.items():
                setattr(core_model, key, value)

            if fields_data is not None:
                core_model.fields = [
                    CoreModelField(**field_data) for field_data in fields_data
                ]

            if schemas_data is not None:
                core_model.schemas = [
                    CoreModelSchema(**schema_data) for schema_data in schemas_data
                ]

            session.add(core_model)
            await session.commit()
            await session.refresh(core_model)
            return await CoreModelRepository.get_by_uuid(core_model.uuid)

    @staticmethod
    async def delete(model_uuid: uuid_lib.UUID):
        async with db.session() as session:
            query = (
                select(CoreModel)
                .where(CoreModel.uuid == model_uuid)
                .options(
                    selectinload(CoreModel.fields),
                    selectinload(CoreModel.schemas),
                )
            )
            result = await session.execute(query)
            core_model = result.scalar_one_or_none()
            if not core_model:
                return False

            await session.delete(core_model)
            await session.commit()
            return True
