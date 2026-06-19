from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from app.core.config.settings import settings


class DatabaseSession:
    def __init__(self, url: str = settings.DB_CONFIG):
        self.engine = create_async_engine(url, echo=settings.DB_ECHO)
        self.SessionLocal = sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )

    async def create_all(self):
        async with self.engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)

    async def drop_all(self):
        async with self.engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.drop_all)

    async def close(self):
        await self.engine.dispose()

    async def __aenter__(self):
        self.session = self.SessionLocal()
        return self.session

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.session.close()

    async def commit_rollback(self):
        try:
            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            raise e


db = DatabaseSession()
