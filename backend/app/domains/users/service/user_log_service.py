import uuid as uuid_lib

from app.core.exceptions import ResourceNotFoundException
from app.domains.users.repository.user_log_repository import UserLogRepository


class UserLogService:
    @staticmethod
    async def get_by_user_id(user_id: int, limit: int = 50):
        return await UserLogRepository.get_by_user_id(user_id, limit)

    @staticmethod
    async def get_by_uuid_and_user_id(log_uuid: uuid_lib.UUID, user_id: int):
        log = await UserLogRepository.get_by_uuid_and_user_id(log_uuid, user_id)
        if not log:
            raise ResourceNotFoundException(
                resource="UserLog",
                resource_id=str(log_uuid),
            )
        return log
