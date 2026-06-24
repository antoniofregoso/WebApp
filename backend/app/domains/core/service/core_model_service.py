import uuid as uuid_lib

from app.core.exceptions import ResourceNotFoundException
from app.domains.core.models.core_model import CoreModel, CoreModelField, CoreModelSchema
from app.domains.core.repository.core_model_repository import CoreModelRepository


class CoreModelService:
    @staticmethod
    async def create(model_data: dict):
        fields_data = model_data.pop("fields", [])
        schemas_data = model_data.pop("schemas", [])
        core_model = CoreModel(**model_data)
        core_model.fields = [CoreModelField(**field_data) for field_data in fields_data]
        core_model.schemas = [
            CoreModelSchema(**schema_data) for schema_data in schemas_data
        ]
        return await CoreModelRepository.create(core_model)

    @staticmethod
    async def get_all():
        return await CoreModelRepository.get_all()

    @staticmethod
    async def get_by_uuid(model_uuid: uuid_lib.UUID):
        core_model = await CoreModelRepository.get_by_uuid(model_uuid)
        if not core_model:
            raise ResourceNotFoundException(
                resource="CoreModel", resource_id=str(model_uuid)
            )
        return core_model

    @staticmethod
    async def get_by_name(name: str):
        core_model = await CoreModelRepository.get_by_name(name)
        if not core_model:
            raise ResourceNotFoundException(resource="CoreModel", resource_id=name)
        return core_model

    @staticmethod
    async def update(model_uuid: uuid_lib.UUID, model_data: dict):
        core_model = await CoreModelRepository.update(model_uuid, model_data)
        if not core_model:
            raise ResourceNotFoundException(
                resource="CoreModel", resource_id=str(model_uuid)
            )
        return core_model

    @staticmethod
    async def delete(model_uuid: uuid_lib.UUID):
        deleted = await CoreModelRepository.delete(model_uuid)
        if not deleted:
            raise ResourceNotFoundException(
                resource="CoreModel", resource_id=str(model_uuid)
            )
        return True
