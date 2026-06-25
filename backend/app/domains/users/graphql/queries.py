import strawberry

from app.domains.users.graphql.types import UserType
from app.core.security.jwt_bearer import IsAuthenticated
from app.core.security.jwt_manager import JWTManager
from app.core.exceptions import AuthorizationException
from app.domains.users.service.user_service import UserService


@strawberry.type
class UserQuery:

    @strawberry.field(permission_classes=[IsAuthenticated])
    async def me(self, info: strawberry.types.Info) -> UserType:
        """Retorna el usuario autenticado actual a partir del token JWT."""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        payload = JWTManager.verify_token(token)
        user = await UserService.get_by_email(payload["sub"])
        if not user.active:
            raise AuthorizationException("User account is disabled")
        return UserType(
            id=user.id,
            uuid=user.uuid,
            name=user.name,
            email=user.email,
            avatar_url=user.avatar_url,
            theme=user.theme.value,
            lang=user.lang.name if user.lang else None,
            active=user.active,
        )
