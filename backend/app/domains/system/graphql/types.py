import uuid as uuid_lib
from datetime import datetime
from typing import Optional

import strawberry
from strawberry.scalars import JSON

from app.domains.system.models.system_colors import SystemColor
from app.domains.system.models.system_message import MessageStatus
from app.domains.system.models.system_model import FieldType
from app.domains.system.models.system_notification import NotificationStatus
from app.domains.system.models.system_task import TaskPriority, TaskStatus

SystemFieldType = strawberry.enum(FieldType)
SystemMessageStatus = strawberry.enum(MessageStatus)
SystemColorType = strawberry.enum(SystemColor)
SystemNotificationStatus = strawberry.enum(NotificationStatus)
SystemTaskPriority = strawberry.enum(TaskPriority)
SystemTaskStatus = strawberry.enum(TaskStatus)


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
    use: str
    view: JSON


@strawberry.type
class SystemModelType:
    uuid: uuid_lib.UUID
    name: str
    fields: list[SystemModelFieldType]
    schemas: list[SystemModelSchemaType]
    created_at: datetime


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
    use: str
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
    priority: SystemTaskPriority = TaskPriority.medium
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
