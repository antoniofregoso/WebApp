import uuid as uuid_lib

from app.core.exceptions import ResourceNotFoundException
from app.domains.core.repository.core_notification_repository import (
    CoreNotificationRepository,
)


class CoreNotificationService:
    @staticmethod
    async def create(notification_data: dict):
        return await CoreNotificationRepository.create(notification_data)

    @staticmethod
    async def get_all():
        return await CoreNotificationRepository.get_all()

    @staticmethod
    async def get_by_uuid(notification_uuid: uuid_lib.UUID):
        notification = await CoreNotificationRepository.get_by_uuid(notification_uuid)
        if not notification:
            raise ResourceNotFoundException(
                resource="CoreNotification", resource_id=str(notification_uuid)
            )
        return notification

    @staticmethod
    async def update(notification_uuid: uuid_lib.UUID, notification_data: dict):
        notification = await CoreNotificationRepository.update(
            notification_uuid, notification_data
        )
        if not notification:
            raise ResourceNotFoundException(
                resource="CoreNotification", resource_id=str(notification_uuid)
            )
        return notification

    @staticmethod
    async def delete(notification_uuid: uuid_lib.UUID):
        deleted = await CoreNotificationRepository.delete(notification_uuid)
        if not deleted:
            raise ResourceNotFoundException(
                resource="CoreNotification", resource_id=str(notification_uuid)
            )
        return True
