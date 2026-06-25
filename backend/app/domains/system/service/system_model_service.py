import uuid as uuid_lib

from app.core.exceptions import ResourceNotFoundException
from app.domains.system.models.system_model import SystemModel, SystemModelField, SystemModelSchema
from app.domains.system.repository.system_model_repository import SystemModelRepository


class SystemModelService:
    @staticmethod
    async def create(model_data: dict):
        fields_data = model_data.pop("fields", [])
        schemas_data = model_data.pop("schemas", [])
        system_model = SystemModel(**model_data)
        system_model.fields = [SystemModelField(**field_data) for field_data in fields_data]
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
