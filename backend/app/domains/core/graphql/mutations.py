from dataclasses import asdict
import uuid as uuid_lib

import strawberry

from app.core.security.jwt_bearer import IsAuthenticated
from app.domains.core.graphql.mappers import (
    core_message_to_type,
    core_model_to_type,
    core_notification_to_type,
)
from app.domains.core.graphql.types import (
    CoreMessageCreateInput,
    CoreMessageType,
    CoreMessageUpdateInput,
    CoreModelCreateInput,
    CoreModelType,
    CoreModelUpdateInput,
    CoreNotificationCreateInput,
    CoreNotificationType,
    CoreNotificationUpdateInput,
)
from app.domains.core.service.core_message_service import CoreMessageService
from app.domains.core.service.core_model_service import CoreModelService
from app.domains.core.service.core_notification_service import CoreNotificationService


def input_to_dict(value):
    data = asdict(value)
    return _remove_none(data)


def _remove_none(value):
    if isinstance(value, dict):
        return {
            key: _remove_none(item)
            for key, item in value.items()
            if item is not None
        }
    if isinstance(value, list):
        return [_remove_none(item) for item in value]
    return value


@strawberry.type
class CoreMutation:
    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def create_core_model(self, model: CoreModelCreateInput) -> CoreModelType:
        core_model = await CoreModelService.create(input_to_dict(model))
        return core_model_to_type(core_model)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def update_core_model(
        self, model_uuid: uuid_lib.UUID, model: CoreModelUpdateInput
    ) -> CoreModelType:
        core_model = await CoreModelService.update(model_uuid, input_to_dict(model))
        return core_model_to_type(core_model)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def delete_core_model(self, model_uuid: uuid_lib.UUID) -> bool:
        return await CoreModelService.delete(model_uuid)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def create_core_message(
        self, message: CoreMessageCreateInput
    ) -> CoreMessageType:
        core_message = await CoreMessageService.create(input_to_dict(message))
        return core_message_to_type(core_message)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def update_core_message(
        self, message_uuid: uuid_lib.UUID, message: CoreMessageUpdateInput
    ) -> CoreMessageType:
        core_message = await CoreMessageService.update(
            message_uuid, input_to_dict(message)
        )
        return core_message_to_type(core_message)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def delete_core_message(self, message_uuid: uuid_lib.UUID) -> bool:
        return await CoreMessageService.delete(message_uuid)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def create_core_notification(
        self, notification: CoreNotificationCreateInput
    ) -> CoreNotificationType:
        core_notification = await CoreNotificationService.create(
            input_to_dict(notification)
        )
        return core_notification_to_type(core_notification)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def update_core_notification(
        self,
        notification_uuid: uuid_lib.UUID,
        notification: CoreNotificationUpdateInput,
    ) -> CoreNotificationType:
        core_notification = await CoreNotificationService.update(
            notification_uuid, input_to_dict(notification)
        )
        return core_notification_to_type(core_notification)

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def delete_core_notification(
        self, notification_uuid: uuid_lib.UUID
    ) -> bool:
        return await CoreNotificationService.delete(notification_uuid)
