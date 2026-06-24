import uuid as uuid_lib

import strawberry

from app.core.security.jwt_bearer import IsAuthenticated
from app.domains.core.graphql.mappers import (
    core_message_to_type,
    core_model_to_type,
    core_notification_to_type,
)
from app.domains.core.graphql.types import (
    CoreMessageType,
    CoreModelType,
    CoreNotificationType,
)
from app.domains.core.service.core_message_service import CoreMessageService
from app.domains.core.service.core_model_service import CoreModelService
from app.domains.core.service.core_notification_service import CoreNotificationService


@strawberry.type
class CoreQuery:
    @strawberry.field(permission_classes=[IsAuthenticated])
    async def core_models(self) -> list[CoreModelType]:
        models = await CoreModelService.get_all()
        return [core_model_to_type(model) for model in models]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def core_model(self, model_uuid: uuid_lib.UUID) -> CoreModelType:
        model = await CoreModelService.get_by_uuid(model_uuid)
        return core_model_to_type(model)

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def core_model_by_name(self, name: str) -> CoreModelType:
        model = await CoreModelService.get_by_name(name)
        return core_model_to_type(model)

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def core_messages(self) -> list[CoreMessageType]:
        messages = await CoreMessageService.get_all()
        return [core_message_to_type(message) for message in messages]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def core_message(self, message_uuid: uuid_lib.UUID) -> CoreMessageType:
        message = await CoreMessageService.get_by_uuid(message_uuid)
        return core_message_to_type(message)

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def core_notifications(self) -> list[CoreNotificationType]:
        notifications = await CoreNotificationService.get_all()
        return [
            core_notification_to_type(notification)
            for notification in notifications
        ]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def core_notification(
        self, notification_uuid: uuid_lib.UUID
    ) -> CoreNotificationType:
        notification = await CoreNotificationService.get_by_uuid(notification_uuid)
        return core_notification_to_type(notification)
