import uuid as uuid_lib

from app.core.exceptions import ResourceNotFoundException
from app.domains.system.repository.system_notification_repository import (
    SystemNotificationRepository,
)


class SystemNotificationService:
    @staticmethod
    async def create(notification_data: dict):
        return await SystemNotificationRepository.create(notification_data)

    @staticmethod
    async def get_all():
        return await SystemNotificationRepository.get_all()

    @staticmethod
    async def get_by_uuid(notification_uuid: uuid_lib.UUID):
        notification = await SystemNotificationRepository.get_by_uuid(notification_uuid)
        if not notification:
            raise ResourceNotFoundException(
                resource="SystemNotification", resource_id=str(notification_uuid)
            )
        return notification

    @staticmethod
    async def count_unread_by_user_id(user_id: int):
        return await SystemNotificationRepository.count_unread_by_user_id(user_id)

    @staticmethod
    async def update(notification_uuid: uuid_lib.UUID, notification_data: dict):
        notification = await SystemNotificationRepository.update(
            notification_uuid, notification_data
        )
        if not notification:
            raise ResourceNotFoundException(
                resource="SystemNotification", resource_id=str(notification_uuid)
            )
        return notification

    @staticmethod
    async def delete(notification_uuid: uuid_lib.UUID):
        deleted = await SystemNotificationRepository.delete(notification_uuid)
        if not deleted:
            raise ResourceNotFoundException(
                resource="SystemNotification", resource_id=str(notification_uuid)
            )
        return True
