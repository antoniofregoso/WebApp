import uvicorn
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
import strawberry
from sqlalchemy.sql import text
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.database.session import db
from app.core.config.settings import settings
from app.core.exceptions import AppException

from app.domains.core.graphql.mutations import CoreMutation
from app.domains.core.graphql.queries import CoreQuery
from app.domains.users.graphql.queries import UserQuery
from app.domains.users.graphql.mutations import UserMutation

from strawberry.fastapi import GraphQLRouter
from app.core.logging import configure_logging, get_logger

# Configurar logging al inicio
configure_logging()
logger = get_logger(__name__)

# Configurar rate limiter
limiter = Limiter(key_func=get_remote_address)


@strawberry.type
class Query(UserQuery, CoreQuery):
    pass


@strawberry.type
class Mutation(UserMutation, CoreMutation):
    pass


def create_error_response(
    status_code: int, error_code: str, message: str, details=None
):
    """Crea una respuesta de error estructurada."""
    return {
        "status_code": status_code,
        "error_code": error_code,
        "message": message,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def init_app():
    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        logger.info("Iniciando aplicación...")
        yield
        logger.info("Cerrando conexión a base de datos...")
        await db.close()

    apps = FastAPI(
        title=settings.APP_NAME,
        description="API description",
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )

    apps.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_CREDENTIALS,
        allow_methods=settings.CORS_METHODS,
        allow_headers=settings.CORS_HEADERS,
    )

    # Exception Handlers
    @apps.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        logger.error(
            f"AppException: {exc.error_code} - {exc.message}",
            extra={"status_code": exc.status_code, "details": exc.details},
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=create_error_response(
                exc.status_code, exc.error_code, exc.message, exc.details
            ),
        )

    @apps.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        logger.warning(f"Validation error on {request.url}: {exc.errors()}")
        errors = []
        for error in exc.errors():
            errors.append(
                {
                    "field": ".".join(str(x) for x in error["loc"][1:]),
                    "message": error["msg"],
                    "type": error["type"],
                }
            )
        return JSONResponse(
            status_code=422,
            content=create_error_response(
                422, "VALIDATION_ERROR", "Request validation failed", {"errors": errors}
            ),
        )

    @apps.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled exception: {str(exc)}")
        return JSONResponse(
            status_code=500,
            content=create_error_response(
                500,
                "INTERNAL_ERROR",
                "An unexpected error occurred",
                {} if not settings.LOG_LEVEL == "DEBUG" else {"error": str(exc)},
            ),
        )

    @apps.exception_handler(RateLimitExceeded)
    async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
        logger.warning(f"Rate limit exceeded for {get_remote_address(request)}")
        return JSONResponse(
            status_code=429,
            content=create_error_response(
                429,
                "RATE_LIMIT_EXCEEDED",
                "Too many requests. Please try again later.",
            ),
        )

    # Aplicar rate limiter a la app
    apps.state.limiter = limiter
    apps.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    @apps.get("/")
    async def root():
        return {"message": "Hello World"}

    @apps.get("/health")
    async def health_check():
        try:
            async with db.session() as session:
                await session.execute(text("SELECT 1"))
            return {"status": "healthy", "database": "online"}
        except Exception as e:
            return JSONResponse(
                status_code=503,
                content={"status": "unhealthy", "database": "offline", "error": str(e)},
            )

    schema = strawberry.Schema(query=Query, mutation=Mutation)
    graphql_app = GraphQLRouter(schema)

    apps.include_router(graphql_app, prefix="/graphql")

    return apps


app = init_app()

if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
