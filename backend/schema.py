"""
schema.py - Tipos base compartidos de GraphQL.
Los tipos de usuarios (UserType, LoginType, etc.) están en app/domains/users/graphql/types.py
"""
import strawberry
from typing import Optional, Any, Dict


@strawberry.type
class ErrorDetail:
    """Detalle de error estructurado."""

    field: Optional[str] = None
    message: str = ""
    value: Optional[str] = None


@strawberry.type
class ErrorResponse:
    """Respuesta de error estándar."""

    status_code: int
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: Optional[str] = None
