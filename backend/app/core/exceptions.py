"""
app/core/exceptions.py
Re-exporta las excepciones centralizadas de la aplicación.
Permite importar desde app.core.exceptions en lugar del módulo raíz.
"""

from exceptions import (
    AppException,
    ValidationException,
    AuthenticationException,
    AuthorizationException,
    ResourceNotFoundException,
    ConflictException,
    DuplicateEntryException,
    DatabaseException,
    ExternalServiceException,
)

__all__ = [
    "AppException",
    "ValidationException",
    "AuthenticationException",
    "AuthorizationException",
    "ResourceNotFoundException",
    "ConflictException",
    "DuplicateEntryException",
    "DatabaseException",
    "ExternalServiceException",
]
