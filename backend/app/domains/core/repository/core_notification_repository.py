import uuid as uuid_lib

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database.session import db
from app.domains.core.models.core_notification import CoreNotification
from app.domains.users.models.user_user import UserUser


class CoreNotificationRepository:
    @staticmethod
    async def create(notification_data: dict):
        user_uuid = notification_data.pop("user_uuid", None)
        user_uuids = notification_data.pop("user_uuids", [])

        async with db.session() as session:
            notification = CoreNotification(**notification_data)

            if user_uuid:
                user = await CoreNotificationRepository._get_user_by_uuid(
                    session, user_uuid
                )
                if user:
                    notification.user_id = user.id

            if user_uuids:
                notification.users = await CoreNotificationRepository._get_users_by_uuid(
                    session, user_uuids
                )

            session.add(notification)
            await session.commit()
            await session.refresh(notification)
            return await CoreNotificationRepository.get_by_uuid(notification.uuid)

    @staticmethod
    async def get_all():
        async with db.session() as session:
            query = (
                select(CoreNotification)
                .options(
                    selectinload(CoreNotification.user),
                    selectinload(CoreNotification.users),
                )
                .order_by(CoreNotification.created_at.desc())
            )
            result = await session.execute(query)
            return result.scalars().all()

    @staticmethod
    async def get_by_uuid(notification_uuid: uuid_lib.UUID):
        async with db.session() as session:
            query = (
                select(CoreNotification)
                .where(CoreNotification.uuid == notification_uuid)
                .options(
                    selectinload(CoreNotification.user),
                    selectinload(CoreNotification.users),
                )
            )
            result = await session.execute(query)
            return result.scalar_one_or_none()

    @staticmethod
    async def update(notification_uuid: uuid_lib.UUID, notification_data: dict):
        user_uuid = notification_data.pop("user_uuid", None)
        user_uuids = notification_data.pop("user_uuids", None)

        async with db.session() as session:
            query = (
                select(CoreNotification)
                .where(CoreNotification.uuid == notification_uuid)
                .options(
                    selectinload(CoreNotification.user),
                    selectinload(CoreNotification.users),
                )
            )
            result = await session.execute(query)
            notification = result.scalar_one_or_none()
            if not notification:
                return None

            for key, value in notification_data.items():
                setattr(notification, key, value)

            if user_uuid is not None:
                user = await CoreNotificationRepository._get_user_by_uuid(
                    session, user_uuid
                )
                notification.user_id = user.id if user else None

            if user_uuids is not None:
                notification.users = await CoreNotificationRepository._get_users_by_uuid(
                    session, user_uuids
                )

            session.add(notification)
            await session.commit()
            await session.refresh(notification)
            return await CoreNotificationRepository.get_by_uuid(notification.uuid)

    @staticmethod
    async def delete(notification_uuid: uuid_lib.UUID):
        async with db.session() as session:
            query = (
                select(CoreNotification)
                .where(CoreNotification.uuid == notification_uuid)
                .options(selectinload(CoreNotification.users))
            )
            result = await session.execute(query)
            notification = result.scalar_one_or_none()
            if not notification:
                return False

            await session.delete(notification)
            await session.commit()
            return True

    @staticmethod
    async def _get_user_by_uuid(session, user_uuid: uuid_lib.UUID):
        query = select(UserUser).where(UserUser.uuid == user_uuid)
        result = await session.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def _get_users_by_uuid(session, user_uuids: list[uuid_lib.UUID]):
        query = select(UserUser).where(UserUser.uuid.in_(user_uuids))
        result = await session.execute(query)
        return result.scalars().all()
