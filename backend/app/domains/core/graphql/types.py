import uuid as uuid_lib
from datetime import datetime
from typing import Optional

import strawberry
from strawberry.scalars import JSON

from app.domains.core.models.core_colors import CoreColor
from app.domains.core.models.core_message import MessageStatus
from app.domains.core.models.core_model import FieldType

CoreFieldType = strawberry.enum(FieldType)
CoreMessageStatus = strawberry.enum(MessageStatus)
CoreNotificationColor = strawberry.enum(CoreColor)


@strawberry.type
class CoreUserRefType:
    uuid: uuid_lib.UUID
    name: str
    email: str


@strawberry.type
class CoreModelFieldType:
    uuid: uuid_lib.UUID
    name: str
    sequence: Optional[int]
    type: CoreFieldType
    required: bool
    readonly: bool
    placeholder: JSON
    help: JSON


@strawberry.type
class CoreModelSchemaType:
    uuid: uuid_lib.UUID
    name: str
    use: str
    view: JSON


@strawberry.type
class CoreModelType:
    uuid: uuid_lib.UUID
    name: str
    fields: list[CoreModelFieldType]
    schemas: list[CoreModelSchemaType]
    created_at: datetime


@strawberry.type
class CoreMessageType:
    uuid: uuid_lib.UUID
    status: CoreMessageStatus
    subject: JSON
    message: JSON
    from_user: Optional[CoreUserRefType]
    to_users: list[CoreUserRefType]
    created_at: datetime


@strawberry.type
class CoreNotificationType:
    uuid: uuid_lib.UUID
    title: JSON
    message: JSON
    read: bool
    color: CoreNotificationColor
    user: Optional[CoreUserRefType]
    users: list[CoreUserRefType]
    created_at: datetime


@strawberry.input
class CoreModelFieldInput:
    name: str
    sequence: Optional[int] = 10
    type: CoreFieldType = FieldType.string
    required: bool = False
    readonly: bool = False
    placeholder: Optional[JSON] = None
    help: Optional[JSON] = None


@strawberry.input
class CoreModelSchemaInput:
    name: str
    use: str
    view: Optional[JSON] = None


@strawberry.input
class CoreModelCreateInput:
    name: str
    fields: Optional[list[CoreModelFieldInput]] = None
    schemas: Optional[list[CoreModelSchemaInput]] = None


@strawberry.input
class CoreModelUpdateInput:
    name: Optional[str] = None
    fields: Optional[list[CoreModelFieldInput]] = None
    schemas: Optional[list[CoreModelSchemaInput]] = None


@strawberry.input
class CoreMessageCreateInput:
    subject: JSON
    message: JSON
    status: CoreMessageStatus = MessageStatus.sent
    from_user_uuid: Optional[uuid_lib.UUID] = None
    to_user_uuids: Optional[list[uuid_lib.UUID]] = None


@strawberry.input
class CoreMessageUpdateInput:
    subject: Optional[JSON] = None
    message: Optional[JSON] = None
    status: Optional[CoreMessageStatus] = None
    from_user_uuid: Optional[uuid_lib.UUID] = None
    to_user_uuids: Optional[list[uuid_lib.UUID]] = None


@strawberry.input
class CoreNotificationCreateInput:
    title: JSON
    message: JSON
    read: bool = False
    color: CoreNotificationColor = CoreColor.zinc
    user_uuid: Optional[uuid_lib.UUID] = None
    user_uuids: Optional[list[uuid_lib.UUID]] = None


@strawberry.input
class CoreNotificationUpdateInput:
    title: Optional[JSON] = None
    message: Optional[JSON] = None
    read: Optional[bool] = None
    color: Optional[CoreNotificationColor] = None
    user_uuid: Optional[uuid_lib.UUID] = None
    user_uuids: Optional[list[uuid_lib.UUID]] = None
