import uuid as uuid_lib

import strawberry

from app.core.exceptions import AuthorizationException
from app.core.security.jwt_bearer import IsAuthenticated
from app.core.security.jwt_manager import JWTManager
from app.domains.system.graphql.mappers import (
    system_message_to_type,
    system_model_to_type,
    system_notification_to_type,
)
from app.domains.system.graphql.types import (
    SystemMessageType,
    SystemModelType,
    SystemNotificationType,
    SystemPendingCountsType,
)
from app.domains.system.service.system_message_service import SystemMessageService
from app.domains.system.service.system_model_service import SystemModelService
from app.domains.system.service.system_notification_service import SystemNotificationService
from app.domains.users.service.user_service import UserService


async def get_current_user(info: strawberry.types.Info):
    request = info.context["request"]
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = JWTManager.verify_token(token)
    user = await UserService.get_by_email(payload["sub"])
    if not user.active:
        raise AuthorizationException("User account is disabled")
    return user


@strawberry.type
class SystemQuery:
    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_models(self) -> list[SystemModelType]:
        models = await SystemModelService.get_all()
        return [system_model_to_type(model) for model in models]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_model(self, model_uuid: uuid_lib.UUID) -> SystemModelType:
        model = await SystemModelService.get_by_uuid(model_uuid)
        return system_model_to_type(model)

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_model_by_name(self, name: str) -> SystemModelType:
        model = await SystemModelService.get_by_name(name)
        return system_model_to_type(model)

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_messages(self) -> list[SystemMessageType]:
        messages = await SystemMessageService.get_all()
        return [system_message_to_type(message) for message in messages]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_message(self, message_uuid: uuid_lib.UUID) -> SystemMessageType:
        message = await SystemMessageService.get_by_uuid(message_uuid)
        return system_message_to_type(message)

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_notifications(self) -> list[SystemNotificationType]:
        notifications = await SystemNotificationService.get_all()
        return [
            system_notification_to_type(notification)
            for notification in notifications
        ]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_notification(
        self, notification_uuid: uuid_lib.UUID
    ) -> SystemNotificationType:
        notification = await SystemNotificationService.get_by_uuid(notification_uuid)
        return system_notification_to_type(notification)

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_pending_counts(
        self, info: strawberry.types.Info
    ) -> SystemPendingCountsType:
        user = await get_current_user(info)
        messages = await SystemMessageService.count_unread_by_user_id(user.id)
        notifications = await SystemNotificationService.count_unread_by_user_id(user.id)
        return SystemPendingCountsType(
            messages=messages,
            notifications=notifications,
        )
