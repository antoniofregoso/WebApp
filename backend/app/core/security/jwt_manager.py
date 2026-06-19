from typing import Optional
from datetime import datetime, timedelta, timezone
import jwt
import logging

from app.core.config.settings import settings

logger = logging.getLogger(__name__)


class JWTManager:
    """Gestiona la generación y verificación de tokens JWT."""

    @staticmethod
    def generate_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Genera un token JWT firmado con los datos proporcionados."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )

        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> dict:
        """Verifica y decodifica un token JWT. Lanza ValueError si es inválido."""
        try:
            decoded = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            return decoded
        except jwt.ExpiredSignatureError:
            logger.warning("Intento de uso de token expirado")
            raise ValueError("Token expired")
        except jwt.InvalidTokenError as e:
            logger.warning(f"Intento de uso de token inválido: {e}")
            raise ValueError("Invalid token")
