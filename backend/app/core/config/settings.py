from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict
from functools import lru_cache
from pathlib import Path
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[3] / ".env",
        case_sensitive=True,
    )

    # App Config
    APP_NAME: str = "API"
    APP_VERSION: str = "0.0.1"

    # Database Config
    DATABASE_URL: str
    DB_ECHO: bool = False

    # Logging
    LOG_LEVEL: str = "INFO"

    # Security / JWT Config
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SESSION_ABSOLUTE_EXPIRE_DAYS: int = 30

    # CORS Config
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:8000"]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: list[str] = ["*"]
    CORS_HEADERS: list[str] = ["*"]

    # Attachment filestore
    FILESTORE_ROOT: Path = Path("data/filestore")
    FILESTORE_NAMESPACE: Optional[str] = None
    ATTACHMENT_MAX_SIZE_BYTES: int = 25 * 1024 * 1024
    ATTACHMENT_ALLOWED_CONTENT_TYPES: list[str] = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.oasis.opendocument.text",
        "application/vnd.oasis.opendocument.spreadsheet",
        "image/gif",
        "image/jpeg",
        "image/png",
        "image/webp",
        "text/csv",
        "text/plain",
    ]


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
