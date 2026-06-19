"""Casos de uso de autenticación del dominio de usuarios."""

from dataclasses import dataclass

from passlib.context import CryptContext
from pydantic import EmailStr, TypeAdapter, ValidationError as PydanticValidationError

from app.core.exceptions import (
    AuthenticationException,
    AuthorizationException,
    DuplicateEntryException,
    ValidationException,
)
from app.core.security.jwt_manager import JWTManager
from app.domains.users.models.user import User
from app.domains.users.repository.user_repository import UserRepository


@dataclass(frozen=True)
class LoginResult:
    email: str
    token: str


class AuthService:
    pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
    email_adapter = TypeAdapter(EmailStr)

    @classmethod
    def normalize_email(cls, email: str) -> str:
        try:
            return str(cls.email_adapter.validate_python(email))
        except PydanticValidationError as exc:
            raise ValidationException("Invalid email address") from exc

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return AuthService.pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def hash_password(password: str) -> str:
        return AuthService.pwd_context.hash(password)

    @classmethod
    async def login(cls, email: str, password: str) -> LoginResult:
        normalized_email = cls.normalize_email(email)
        existing_user = await UserRepository.get_by_email(normalized_email)

        if not existing_user or not cls.verify_password(
            password, existing_user.password
        ):
            raise AuthenticationException("Invalid email or password")
        if existing_user.disabled:
            raise AuthorizationException("User account is disabled")

        token = JWTManager.generate_token({"sub": existing_user.email})
        return LoginResult(email=existing_user.email, token=token)

    @classmethod
    async def register(cls, name: str, email: str, password: str) -> str:
        normalized_name = name.strip()
        normalized_email = cls.normalize_email(email)

        if not 2 <= len(normalized_name) <= 100:
            raise ValidationException("Name must contain between 2 and 100 characters")
        if len(password) < 8:
            raise ValidationException("Password must contain at least 8 characters")

        if await UserRepository.get_by_email(normalized_email):
            raise DuplicateEntryException(field="email", value=normalized_email)

        new_user = User(
            name=normalized_name,
            email=normalized_email,
            password=cls.hash_password(password),
        )
        await UserRepository.create(new_user)
        return "User registered successfully"
