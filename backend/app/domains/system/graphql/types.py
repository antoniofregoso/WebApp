import uuid as uuid_lib
from datetime import datetime
from typing import Optional

import strawberry
from strawberry.scalars import JSON

from app.domains.system.models.system_colors import SystemColor
from app.domains.system.models.system_message import MessageStatus
from app.domains.system.models.system_model import FieldType, SystemModelSchemaUse
from app.domains.system.models.system_notification import NotificationStatus
from app.domains.system.models.system_task import TaskPriority, TaskStatus
from app.domains.system.models.system_whatsapp import (
    WhatsAppMessageDirection,
    WhatsAppMessageStatus,
    WhatsAppTemplateCategory,
    WhatsAppTemplateStatus,
)

SystemFieldType = strawberry.enum(FieldType)
SystemModelSchemaUseType = strawberry.enum(SystemModelSchemaUse)
SystemMessageStatus = strawberry.enum(MessageStatus)
SystemColorType = strawberry.enum(SystemColor)
SystemNotificationStatus = strawberry.enum(NotificationStatus)
SystemTaskPriority = strawberry.enum(TaskPriority)
SystemTaskStatus = strawberry.enum(TaskStatus)
SystemWhatsAppMessageDirection = strawberry.enum(WhatsAppMessageDirection)
SystemWhatsAppMessageStatus = strawberry.enum(WhatsAppMessageStatus)
SystemWhatsAppTemplateCategory = strawberry.enum(WhatsAppTemplateCategory)
SystemWhatsAppTemplateStatus = strawberry.enum(WhatsAppTemplateStatus)


@strawberry.type
class SystemUserRefType:
    uuid: uuid_lib.UUID
    name: str
    email: str


@strawberry.type
class SystemModelFieldType:
    uuid: uuid_lib.UUID
    name: str
    sequence: Optional[int]
    type: SystemFieldType
    required: bool
    readonly: bool
    placeholder: JSON
    help: JSON


@strawberry.type
class SystemModelSchemaType:
    uuid: uuid_lib.UUID
    name: str
    use: SystemModelSchemaUseType
    view: JSON


@strawberry.type
class SystemModelType:
    uuid: uuid_lib.UUID
    name: str
    fields: list[SystemModelFieldType]
    schemas: list[SystemModelSchemaType]
    created_at: datetime


@strawberry.type
class SystemModelViewType:
    model: JSON
    records: list[JSON]


@strawberry.type
class SystemMessageType:
    uuid: uuid_lib.UUID
    status: SystemMessageStatus
    date: datetime
    subject: JSON
    message: JSON
    from_user: Optional[SystemUserRefType]
    to_users: list[SystemUserRefType]
    created_at: datetime


@strawberry.type
class SystemNotificationType:
    uuid: uuid_lib.UUID
    date: datetime
    status: SystemNotificationStatus
    title: JSON
    message: JSON
    read: bool
    active: bool
    sequence: Optional[int]
    color: SystemColorType
    user: Optional[SystemUserRefType]
    users: list[SystemUserRefType]
    created_at: datetime


@strawberry.type
class SystemPendingCountsType:
    messages: int
    notifications: int


@strawberry.type
class SystemTaskType:
    uuid: uuid_lib.UUID
    status: SystemTaskStatus
    color: SystemColorType
    sequence: Optional[int]
    title: JSON
    description: JSON
    priority: SystemTaskPriority
    date_assign: Optional[datetime]
    date_due: Optional[datetime]
    user: Optional[SystemUserRefType]
    created_at: datetime


@strawberry.type
class SystemWhatsAppType:
    uuid: uuid_lib.UUID
    name: str
    active: bool
    phone_number: str
    phone_number_id: str
    business_account_id: str
    api_version: Optional[str]
    webhook_url: Optional[str]
    created_at: datetime


@strawberry.type
class SystemWhatsAppTemplateType:
    uuid: uuid_lib.UUID
    name: str
    language: str
    category: SystemWhatsAppTemplateCategory
    status: SystemWhatsAppTemplateStatus
    external_template_id: Optional[str]
    namespace: Optional[str]
    components: JSON
    rejected_reason: Optional[str]
    active: bool
    created_at: datetime


@strawberry.type
class SystemWhatsAppMessageType:
    uuid: uuid_lib.UUID
    direction: SystemWhatsAppMessageDirection
    status: SystemWhatsAppMessageStatus
    message_type: str
    from_number: str
    to_number: str
    body: Optional[str]
    payload: JSON
    date: datetime
    error_message: Optional[str]
    template_uuid: Optional[uuid_lib.UUID]
    created_at: datetime


@strawberry.input
class SystemModelFieldInput:
    name: str
    sequence: Optional[int] = 10
    type: SystemFieldType = FieldType.string
    required: bool = False
    readonly: bool = False
    placeholder: Optional[JSON] = None
    help: Optional[JSON] = None


@strawberry.input
class SystemModelSchemaInput:
    name: str
    use: SystemModelSchemaUseType = SystemModelSchemaUse.view
    view: Optional[JSON] = None


@strawberry.input
class SystemModelCreateInput:
    name: str
    fields: Optional[list[SystemModelFieldInput]] = None
    schemas: Optional[list[SystemModelSchemaInput]] = None


@strawberry.input
class SystemModelUpdateInput:
    name: Optional[str] = None
    fields: Optional[list[SystemModelFieldInput]] = None
    schemas: Optional[list[SystemModelSchemaInput]] = None


@strawberry.input
class SystemMessageCreateInput:
    subject: JSON
    message: JSON
    status: SystemMessageStatus = MessageStatus.sent
    date: Optional[datetime] = None
    from_user_uuid: Optional[uuid_lib.UUID] = None
    to_user_uuids: Optional[list[uuid_lib.UUID]] = None


@strawberry.input
class SystemMessageUpdateInput:
    subject: Optional[JSON] = None
    message: Optional[JSON] = None
    status: Optional[SystemMessageStatus] = None
    date: Optional[datetime] = None
    from_user_uuid: Optional[uuid_lib.UUID] = None
    to_user_uuids: Optional[list[uuid_lib.UUID]] = None


@strawberry.input
class SystemNotificationCreateInput:
    title: JSON
    message: JSON
    date: Optional[datetime] = None
    status: SystemNotificationStatus = NotificationStatus.sent
    read: bool = False
    active: bool = False
    sequence: Optional[int] = 10
    color: SystemColorType = SystemColor.zinc
    user_uuid: Optional[uuid_lib.UUID] = None
    user_uuids: Optional[list[uuid_lib.UUID]] = None


@strawberry.input
class SystemNotificationUpdateInput:
    title: Optional[JSON] = None
    message: Optional[JSON] = None
    date: Optional[datetime] = None
    status: Optional[SystemNotificationStatus] = None
    read: Optional[bool] = None
    active: Optional[bool] = None
    sequence: Optional[int] = None
    color: Optional[SystemColorType] = None
    user_uuid: Optional[uuid_lib.UUID] = None
    user_uuids: Optional[list[uuid_lib.UUID]] = None


@strawberry.input
class SystemTaskCreateInput:
    title: JSON
    description: JSON
    status: SystemTaskStatus = TaskStatus.pending
    color: SystemColorType = SystemColor.zinc
    sequence: Optional[int] = 10
    priority: SystemTaskPriority = TaskPriority.low
    date_assign: Optional[datetime] = None
    date_due: Optional[datetime] = None
    user_uuid: Optional[uuid_lib.UUID] = None


@strawberry.input
class SystemTaskUpdateInput:
    title: Optional[JSON] = None
    description: Optional[JSON] = None
    status: Optional[SystemTaskStatus] = None
    color: Optional[SystemColorType] = None
    sequence: Optional[int] = None
    priority: Optional[SystemTaskPriority] = None
    date_assign: Optional[datetime] = None
    date_due: Optional[datetime] = None
    user_uuid: Optional[uuid_lib.UUID] = None


@strawberry.input
class SystemWhatsAppCreateInput:
    name: str
    phone_number: str
    phone_number_id: str
    business_account_id: str
    active: bool = True
    api_version: Optional[str] = None
    access_token: Optional[str] = None
    verify_token: Optional[str] = None
    app_secret: Optional[str] = None
    webhook_url: Optional[str] = None


@strawberry.input
class SystemWhatsAppUpdateInput:
    name: Optional[str] = None
    phone_number: Optional[str] = None
    phone_number_id: Optional[str] = None
    business_account_id: Optional[str] = None
    active: Optional[bool] = None
    api_version: Optional[str] = None
    access_token: Optional[str] = None
    verify_token: Optional[str] = None
    app_secret: Optional[str] = None
    webhook_url: Optional[str] = None


@strawberry.input
class SystemWhatsAppTemplateCreateInput:
    whatsapp_uuid: uuid_lib.UUID
    name: str
    language: str
    category: SystemWhatsAppTemplateCategory = WhatsAppTemplateCategory.utility
    status: SystemWhatsAppTemplateStatus = WhatsAppTemplateStatus.pending
    external_template_id: Optional[str] = None
    namespace: Optional[str] = None
    components: Optional[JSON] = None
    active: bool = True


@strawberry.input
class SystemWhatsAppTemplateUpdateInput:
    name: Optional[str] = None
    language: Optional[str] = None
    category: Optional[SystemWhatsAppTemplateCategory] = None
    status: Optional[SystemWhatsAppTemplateStatus] = None
    external_template_id: Optional[str] = None
    namespace: Optional[str] = None
    components: Optional[JSON] = None
    rejected_reason: Optional[str] = None
    active: Optional[bool] = None


@strawberry.input
class SystemWhatsAppMessageCreateInput:
    whatsapp_uuid: uuid_lib.UUID
    from_number: str
    to_number: str
    direction: SystemWhatsAppMessageDirection = WhatsAppMessageDirection.outbound
    status: SystemWhatsAppMessageStatus = WhatsAppMessageStatus.queued
    message_type: str = "text"
    body: Optional[str] = None
    payload: Optional[JSON] = None
    date: Optional[datetime] = None
    template_uuid: Optional[uuid_lib.UUID] = None
    model_uuid: Optional[uuid_lib.UUID] = None
    record_uuid: Optional[uuid_lib.UUID] = None
