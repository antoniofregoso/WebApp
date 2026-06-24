import uuid as uuid_lib

from app.core.exceptions import ResourceNotFoundException
from app.domains.core.repository.core_message_repository import CoreMessageRepository


class CoreMessageService:
    @staticmethod
    async def create(message_data: dict):
        return await CoreMessageRepository.create(message_data)

    @staticmethod
    async def get_all():
        return await CoreMessageRepository.get_all()

    @staticmethod
    async def get_by_uuid(message_uuid: uuid_lib.UUID):
        message = await CoreMessageRepository.get_by_uuid(message_uuid)
        if not message:
            raise ResourceNotFoundException(
                resource="CoreMessage", resource_id=str(message_uuid)
            )
        return message

    @staticmethod
    async def update(message_uuid: uuid_lib.UUID, message_data: dict):
        message = await CoreMessageRepository.update(message_uuid, message_data)
        if not message:
            raise ResourceNotFoundException(
                resource="CoreMessage", resource_id=str(message_uuid)
            )
        return message

    @staticmethod
    async def delete(message_uuid: uuid_lib.UUID):
        deleted = await CoreMessageRepository.delete(message_uuid)
        if not deleted:
            raise ResourceNotFoundException(
                resource="CoreMessage", resource_id=str(message_uuid)
            )
        return True
