import uuid as uuid_lib

import strawberry

from app.core.exceptions import AuthorizationException
from app.core.security.jwt_bearer import IsAuthenticated
from app.core.security.jwt_manager import JWTManager
from app.domains.system.graphql.mappers import (
    system_message_to_type,
    system_model_to_type,
    system_notification_to_type,
    system_task_to_type,
    system_whatsapp_message_to_type,
    system_whatsapp_template_to_type,
    system_whatsapp_to_type,
)
from app.domains.system.graphql.types import (
    SystemMessageType,
    SystemModelType,
    SystemNotificationType,
    SystemPendingCountsType,
    SystemTaskType,
    SystemWhatsAppMessageType,
    SystemWhatsAppTemplateType,
    SystemWhatsAppType,
)
from app.domains.system.service.system_message_service import SystemMessageService
from app.domains.system.service.system_model_service import SystemModelService
from app.domains.system.service.system_notification_service import (
    SystemNotificationService,
)
from app.domains.system.service.system_task_service import SystemTaskService
from app.domains.system.service.system_whatsapp_message_service import (
    SystemWhatsAppMessageService,
)
from app.domains.system.service.system_whatsapp_service import SystemWhatsAppService
from app.domains.system.service.system_whatsapp_template_service import (
    SystemWhatsAppTemplateService,
)
from app.domains.users.service.user_service import UserService


async def get_current_user(info: strawberry.types.Info):
    request = info.context["request"]
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = JWTManager.verify_token(token)
    user = await UserService.get_by_email(payload["sub"])
    if not user.active:
        raise AuthorizationException("User account is disabled")
    return user


def _ensure_whatsapp_belongs_to_company(whatsapp, company_id: int | None):
    if whatsapp.company_id != company_id:
        raise AuthorizationException(
            "WhatsApp configuration does not belong to your company"
        )


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
            system_notification_to_type(notification) for notification in notifications
        ]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_notification(
        self, notification_uuid: uuid_lib.UUID
    ) -> SystemNotificationType:
        notification = await SystemNotificationService.get_by_uuid(notification_uuid)
        return system_notification_to_type(notification)

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_tasks(self) -> list[SystemTaskType]:
        tasks = await SystemTaskService.get_all()
        return [system_task_to_type(task) for task in tasks]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_task(self, task_uuid: uuid_lib.UUID) -> SystemTaskType:
        task = await SystemTaskService.get_by_uuid(task_uuid)
        return system_task_to_type(task)

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

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_whatsapp_configurations(
        self, info: strawberry.types.Info
    ) -> list[SystemWhatsAppType]:
        user = await get_current_user(info)
        configurations = await SystemWhatsAppService.get_all(user.company_id)
        return [system_whatsapp_to_type(whatsapp) for whatsapp in configurations]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_whatsapp(
        self, whatsapp_uuid: uuid_lib.UUID, info: strawberry.types.Info
    ) -> SystemWhatsAppType:
        user = await get_current_user(info)
        whatsapp = await SystemWhatsAppService.get_by_uuid(whatsapp_uuid)
        _ensure_whatsapp_belongs_to_company(whatsapp, user.company_id)
        return system_whatsapp_to_type(whatsapp)

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_whatsapp_templates(
        self, whatsapp_uuid: uuid_lib.UUID, info: strawberry.types.Info
    ) -> list[SystemWhatsAppTemplateType]:
        user = await get_current_user(info)
        whatsapp = await SystemWhatsAppService.get_by_uuid(whatsapp_uuid)
        _ensure_whatsapp_belongs_to_company(whatsapp, user.company_id)
        templates = await SystemWhatsAppTemplateService.get_all_by_whatsapp(
            whatsapp_uuid
        )
        return [system_whatsapp_template_to_type(template) for template in templates]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_whatsapp_template(
        self, template_uuid: uuid_lib.UUID
    ) -> SystemWhatsAppTemplateType:
        template = await SystemWhatsAppTemplateService.get_by_uuid(template_uuid)
        return system_whatsapp_template_to_type(template)

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_whatsapp_messages(
        self, whatsapp_uuid: uuid_lib.UUID, info: strawberry.types.Info
    ) -> list[SystemWhatsAppMessageType]:
        user = await get_current_user(info)
        whatsapp = await SystemWhatsAppService.get_by_uuid(whatsapp_uuid)
        _ensure_whatsapp_belongs_to_company(whatsapp, user.company_id)
        messages = await SystemWhatsAppMessageService.get_all_by_whatsapp(
            whatsapp_uuid
        )
        return [system_whatsapp_message_to_type(message) for message in messages]

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def system_whatsapp_message(
        self, message_uuid: uuid_lib.UUID
    ) -> SystemWhatsAppMessageType:
        message = await SystemWhatsAppMessageService.get_by_uuid(message_uuid)
        return system_whatsapp_message_to_type(message)
