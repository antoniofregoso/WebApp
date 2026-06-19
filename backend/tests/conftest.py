"""Test configuration and fixtures."""

import pytest
from fastapi.testclient import TestClient
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from main import app
from app.core.database.session import db


@pytest.fixture
def client():
    """Crea un cliente de prueba para la aplicación."""
    return TestClient(app)


@pytest.fixture
async def async_client():
    """Crea un cliente asincrónico para la aplicación."""
    async with TestClient(app) as client:
        yield client


@pytest.fixture
def event_loop():
    """Crea un event loop para tests async."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
