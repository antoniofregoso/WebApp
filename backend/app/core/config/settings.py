from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    # App Config
    APP_NAME: str = "API"
    APP_VERSION: str = "0.0.1"

    # Database Config
    DB_CONFIG: str
    DB_ECHO: bool = False

    # Logging
    LOG_LEVEL: str = "INFO"

    # Security / JWT Config
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS Config
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:8000"]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: list[str] = ["*"]
    CORS_HEADERS: list[str] = ["*"]


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
