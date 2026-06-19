import strawberry

from app.domains.users.graphql.types import UserType
from app.core.security.jwt_bearer import IsAuthenticated
from app.core.security.jwt_manager import JWTManager
from app.domains.users.repository.user_repository import UserRepository


@strawberry.type
class UserQuery:

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def me(self, info: strawberry.types.Info) -> UserType:
        """Retorna el usuario autenticado actual a partir del token JWT."""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        payload = JWTManager.verify_token(token)
        user = await UserRepository.get_by_email(payload["sub"])
        return UserType(
            id=user.id,
            uuid=user.uuid,
            name=user.name,
            email=user.email,
            disabled=user.disabled,
        )
