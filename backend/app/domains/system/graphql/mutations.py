from dataclasses import asdict
import uuid as uuid_lib

import strawberry

from app.core.security.jwt_bearer import IsAuthenticated
from app.domains.system.graphql.mappers import (
    system_message_to_type,
    system_model_to_type,
    system_notification_to_type,
    system_task_to_type,
)
from app.domains.system.graphql.types import (
    SystemMessageCreateInput,
    SystemMessageType,
    SystemMessageUpdateInput,
    SystemModelCreateInput,
    SystemModelType,
    SystemModelUpdateInput,
    SystemNotificationCreateInput,
    SystemNotificationType,
    SystemNotificationUpdateInput,
    SystemTaskCreateInput,
    SystemTaskType,
    SystemTaskUpdateInput,
)
from app.domains.system.service.system_message_service import SystemMessageService
from app.domains.system.service.system_model_service import SystemModelService
from app.domains.system.service.system_notification_service import (
    SystemNotificationService,
)
from app.domains.system.service.system_task_service import SystemTaskService


def input_to_dict(value):
    data = asdict(value)
    return _remove_none(data)


def _remove_none(value):
    if isinstance(value, dict):
        return {
            key: _remove_none(item) for key, item in value.items() if item is not None
        }
    if isinstance(value, list):
        return [_remove_none(item) for item in value]
    return value


@strawberry.type
class SystemMutation:
    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def create_system_model(
        self, model: SystemModelCreateInput
    ) -> SystemModelType:
        system_model = await SystemModelService.create(input_to_dict(model))
        return system_model_to_type(system_model)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def update_system_model(
        self, model_uuid: uuid_lib.UUID, model: SystemModelUpdateInput
    ) -> SystemModelType:
        system_model = await SystemModelService.update(model_uuid, input_to_dict(model))
        return system_model_to_type(system_model)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def delete_system_model(self, model_uuid: uuid_lib.UUID) -> bool:
        return await SystemModelService.delete(model_uuid)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def create_system_message(
        self, message: SystemMessageCreateInput
    ) -> SystemMessageType:
        system_message = await SystemMessageService.create(input_to_dict(message))
        return system_message_to_type(system_message)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def update_system_message(
        self, message_uuid: uuid_lib.UUID, message: SystemMessageUpdateInput
    ) -> SystemMessageType:
        system_message = await SystemMessageService.update(
            message_uuid, input_to_dict(message)
        )
        return system_message_to_type(system_message)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def delete_system_message(self, message_uuid: uuid_lib.UUID) -> bool:
        return await SystemMessageService.delete(message_uuid)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def create_system_notification(
        self, notification: SystemNotificationCreateInput
    ) -> SystemNotificationType:
        system_notification = await SystemNotificationService.create(
            input_to_dict(notification)
        )
        return system_notification_to_type(system_notification)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def update_system_notification(
        self,
        notification_uuid: uuid_lib.UUID,
        notification: SystemNotificationUpdateInput,
    ) -> SystemNotificationType:
        system_notification = await SystemNotificationService.update(
            notification_uuid, input_to_dict(notification)
        )
        return system_notification_to_type(system_notification)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def delete_system_notification(
        self, notification_uuid: uuid_lib.UUID
    ) -> bool:
        return await SystemNotificationService.delete(notification_uuid)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def create_system_task(self, task: SystemTaskCreateInput) -> SystemTaskType:
        system_task = await SystemTaskService.create(input_to_dict(task))
        return system_task_to_type(system_task)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def update_system_task(
        self, task_uuid: uuid_lib.UUID, task: SystemTaskUpdateInput
    ) -> SystemTaskType:
        system_task = await SystemTaskService.update(task_uuid, input_to_dict(task))
        return system_task_to_type(system_task)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def delete_system_task(self, task_uuid: uuid_lib.UUID) -> bool:
        return await SystemTaskService.delete(task_uuid)
