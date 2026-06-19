import uuid as uuid_lib

from app.domains.users.repository.user_repository import UserRepository
from app.core.exceptions import ResourceNotFoundException


class UserService:

    @staticmethod
    async def get_all():
        return await UserRepository.get_all()

    @staticmethod
    async def get_user_by_uuid(user_uuid: uuid_lib.UUID):
        user = await UserRepository.get_user_by_uuid(user_uuid)
        if not user:
            raise ResourceNotFoundException(resource="User", resource_id=str(user_uuid))
        return user

    @staticmethod
    async def get_by_email(email: str):
        user = await UserRepository.get_by_email(email)
        if not user:
            raise ResourceNotFoundException(resource="User", resource_id=email)
        return user

    @staticmethod
    async def update(user_uuid: uuid_lib.UUID, user_data: dict):
        user = await UserRepository.update(user_uuid, user_data)
        if not user:
            raise ResourceNotFoundException(resource="User", resource_id=str(user_uuid))
        return user

    @staticmethod
    async def delete(user_uuid: uuid_lib.UUID):
        deleted = await UserRepository.delete(user_uuid)
        if not deleted:
            raise ResourceNotFoundException(resource="User", resource_id=str(user_uuid))
        return True
