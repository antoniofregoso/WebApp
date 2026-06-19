import strawberry

from app.domains.users.graphql.types import LoginType, LoginInput, RegisterInput
from app.domains.users.service.auth_service import AuthService


@strawberry.type
class UserMutation:

    @strawberry.mutation
    async def login(self, login: LoginInput) -> LoginType:
        """Autentica un usuario y retorna el token JWT."""
        result = await AuthService.login(login.email, login.password)
        return LoginType(email=result.email, token=result.token)

    @strawberry.mutation
    async def register(self, register: RegisterInput) -> str:
        """Registra un nuevo usuario en el sistema."""
        return await AuthService.register(
            register.name, register.email, register.password
        )
