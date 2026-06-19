import strawberry

from app.domains.users.graphql.types import LoginType, LoginInput, RegisterInput
from app.core.auth.auth_service import AuthService
from app.core.security.jwt_bearer import IsAuthenticated


@strawberry.type
class UserMutation:

    @strawberry.mutation
    async def login(self, login: LoginInput) -> LoginType:
        """Autentica un usuario y retorna el token JWT."""
        return await AuthService.login(login)

    @strawberry.mutation
    async def register(self, register: RegisterInput) -> str:
        """Registra un nuevo usuario en el sistema."""
        return await AuthService.register(register)
