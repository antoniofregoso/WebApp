import uuid as uuid_lib

from sqlalchemy import select

from app.core.database.session import db
from app.domains.users.models.user_log import UserLog


class UserLogRepository:
    @staticmethod
    async def get_by_user_id(user_id: int, limit: int = 50):
        async with db.session() as session:
            query = (
                select(UserLog)
                .where(UserLog.user_id == user_id)
                .order_by(UserLog.start_date.desc())
                .limit(limit)
            )
            result = await session.execute(query)
            return result.scalars().all()

    @staticmethod
    async def get_by_uuid_and_user_id(log_uuid: uuid_lib.UUID, user_id: int):
        async with db.session() as session:
            query = select(UserLog).where(
                UserLog.uuid == log_uuid,
                UserLog.user_id == user_id,
            )
            result = await session.execute(query)
            return result.scalar_one_or_none()
