from app.domains.core.graphql.types import (
    CoreMessageType,
    CoreModelFieldType,
    CoreModelSchemaType,
    CoreModelType,
    CoreNotificationType,
    CoreUserRefType,
)


def user_to_type(user):
    if not user:
        return None
    return CoreUserRefType(uuid=user.uuid, name=user.name, email=user.email)


def core_model_to_type(core_model):
    return CoreModelType(
        uuid=core_model.uuid,
        name=core_model.name,
        fields=[
            CoreModelFieldType(
                uuid=field.uuid,
                name=field.name,
                sequence=field.sequence,
                type=field.type,
                required=field.required,
                readonly=field.readonly,
                placeholder=field.placeholder,
                help=field.help,
            )
            for field in core_model.fields
        ],
        schemas=[
            CoreModelSchemaType(
                uuid=schema.uuid,
                name=schema.name,
                use=schema.use,
                view=schema.view,
            )
            for schema in core_model.schemas
        ],
        created_at=core_model.created_at,
    )


def core_message_to_type(message):
    return CoreMessageType(
        uuid=message.uuid,
        status=message.status,
        subject=message.subject,
        message=message.message,
        from_user=user_to_type(message.from_user),
        to_users=[user_to_type(user) for user in message.to_users],
        created_at=message.created_at,
    )


def core_notification_to_type(notification):
    return CoreNotificationType(
        uuid=notification.uuid,
        title=notification.title,
        message=notification.message,
        read=notification.read,
        color=notification.color,
        user=user_to_type(notification.user),
        users=[user_to_type(user) for user in notification.users],
        created_at=notification.created_at,
    )
