from passlib.context import CryptContext

from app.domains.users.models.user import User
from app.domains.users.repository.user_repository import UserRepository
from app.domains.users.graphql.types import RegisterInput, LoginInput, LoginType
from app.core.security.jwt_manager import JWTManager
from app.core.exceptions import (
    AuthenticationException,
    DuplicateEntryException,
)


class AuthService:
    """Servicio de autenticación: login y registro de usuarios."""

    pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifica que la contraseña en texto plano coincida con el hash almacenado."""
        return AuthService.pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def hash_password(password: str) -> str:
        """Genera el hash seguro de una contraseña."""
        return AuthService.pwd_context.hash(password)

    @staticmethod
    async def login(login: LoginInput) -> LoginType:
        """
        Autentica un usuario verificando email y contraseña.
        Retorna un LoginType con el token JWT generado.
        """
        existing_user = await UserRepository.get_by_email(login.email)

        if not existing_user:
            raise AuthenticationException("Email not found")

        if not AuthService.verify_password(login.password, existing_user.password):
            raise AuthenticationException("Incorrect password")

        token = JWTManager.generate_token({"sub": existing_user.email})

        return LoginType(email=existing_user.email, token=token)

    @staticmethod
    async def register(user: RegisterInput) -> str:
        """
        Registra un nuevo usuario en el sistema.
        Lanza DuplicateEntryException si el email ya existe.
        """
        existing_user = await UserRepository.get_by_email(user.email)

        if existing_user:
            raise DuplicateEntryException(field="email", value=user.email)

        hashed_password = AuthService.hash_password(user.password)
        new_user = User(name=user.name, email=user.email, password=hashed_password)
        await UserRepository.create(new_user)

        return "User registered successfully"
