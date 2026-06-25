from app.domains.system.graphql.types import (
    SystemMessageType,
    SystemModelFieldType,
    SystemModelSchemaType,
    SystemModelType,
    SystemNotificationType,
    SystemUserRefType,
)


def user_to_type(user):
    if not user:
        return None
    return SystemUserRefType(uuid=user.uuid, name=user.name, email=user.email)


def system_model_to_type(system_model):
    return SystemModelType(
        uuid=system_model.uuid,
        name=system_model.name,
        fields=[
            SystemModelFieldType(
                uuid=field.uuid,
                name=field.name,
                sequence=field.sequence,
                type=field.type,
                required=field.required,
                readonly=field.readonly,
                placeholder=field.placeholder,
                help=field.help,
            )
            for field in system_model.fields
        ],
        schemas=[
            SystemModelSchemaType(
                uuid=schema.uuid,
                name=schema.name,
                use=schema.use,
                view=schema.view,
            )
            for schema in system_model.schemas
        ],
        created_at=system_model.created_at,
    )


def system_message_to_type(message):
    return SystemMessageType(
        uuid=message.uuid,
        status=message.status,
        date=message.date,
        subject=message.subject,
        message=message.message,
        from_user=user_to_type(message.from_user),
        to_users=[user_to_type(user) for user in message.to_users],
        created_at=message.created_at,
    )


def system_notification_to_type(notification):
    return SystemNotificationType(
        uuid=notification.uuid,
        date=notification.date,
        status=notification.status,
        title=notification.title,
        message=notification.message,
        read=notification.read,
        color=notification.color,
        user=user_to_type(notification.user),
        users=[user_to_type(user) for user in notification.users],
        created_at=notification.created_at,
    )
