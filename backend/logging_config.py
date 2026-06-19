import logging
import sys
import json
from datetime import datetime
from pythonjsonlogger import jsonlogger
from app.core.config.settings import settings


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Formateador JSON personalizado con campos adicionales."""

    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record["timestamp"] = datetime.utcnow().isoformat()
        log_record["level"] = record.levelname
        log_record["logger"] = record.name
        log_record["module"] = record.module


def configure_logging():
    """Configura el logging global de la aplicación con soporte para JSON."""

    numeric_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Handler para consola en formato JSON
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)

    # Formateador JSON
    json_formatter = CustomJsonFormatter(
        "%(timestamp)s %(level)s %(logger)s %(message)s"
    )
    console_handler.setFormatter(json_formatter)

    # Limpiar handlers previos
    root_logger.handlers.clear()
    root_logger.addHandler(console_handler)

    # Silenciar logs de librerías ruidosas
    logging.getLogger("multipart").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    logger = logging.getLogger("api")
    logger.info(
        "Logging configured",
        extra={
            "log_level": settings.LOG_LEVEL,
            "environment": "development",
        },
    )


def get_logger(name: str):
    """Obtiene un logger configurado para un módulo."""
    return logging.getLogger(name)
