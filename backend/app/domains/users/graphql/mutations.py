import strawberry

from app.domains.users.graphql.types import (
    LoginType,
    LoginInput,
    RefreshSessionInput,
    LogoutInput,
    RegisterInput,
)
from app.domains.users.service.auth_service import AuthService


@strawberry.type
class UserMutation:

    @strawberry.mutation
    async def login(self, login: LoginInput) -> LoginType:
        """Autentica un usuario y retorna access/refresh tokens JWT."""
        result = await AuthService.login(login.email, login.password)
        return LoginType(
            email=result.email,
            token=result.token,
            access_token=result.access_token,
            refresh_token=result.refresh_token,
        )

    @strawberry.mutation
    async def refresh_session(self, refresh: RefreshSessionInput) -> LoginType:
        """Renueva la sesión usando un refresh token válido."""
        result = await AuthService.refresh_session(refresh.refresh_token)
        return LoginType(
            email=result.email,
            token=result.token,
            access_token=result.access_token,
            refresh_token=result.refresh_token,
        )

    @strawberry.mutation
    async def logout(self, logout: LogoutInput) -> bool:
        """Revoca la sesión asociada al refresh token enviado."""
        return await AuthService.logout(logout.refresh_token)

    @strawberry.mutation
    async def register(self, register: RegisterInput) -> str:
        """Registra un nuevo usuario en el sistema."""
        return await AuthService.register(
            register.name, register.email, register.password
        )
