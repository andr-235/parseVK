import asyncio

from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from app.infrastructure.db import models  # noqa: F401
from app.infrastructure.db.base import Base
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

PREVIOUS_REVISION = "30edcb443fca"


async def execute(database_url: str, statement: str) -> None:
    engine = create_async_engine(database_url)
    try:
        async with engine.begin() as connection:
            await connection.execute(text(statement))
    finally:
        await engine.dispose()


async def metadata_diff(database_url: str):
    engine = create_async_engine(database_url)
    try:
        async with engine.connect() as connection:
            return await connection.run_sync(
                lambda sync: compare_metadata(
                    MigrationContext.configure(sync),
                    Base.metadata,
                )
            )
    finally:
        await engine.dispose()


def test_upgrade_duplicate_guard_downgrade_and_metadata(
    postgres_url,
    run_alembic,
):
    run_alembic("downgrade", "base")
    run_alembic("upgrade", "head")
    run_alembic("downgrade", PREVIOUS_REVISION)
    asyncio.run(
        execute(
            postgres_url,
            """
            INSERT INTO im_messages (messenger, external_id, chat_external_id)
            VALUES ('whatsapp', 'duplicate', 'chat'),
                   ('whatsapp', 'duplicate', 'chat')
            """,
        )
    )

    failed = run_alembic("upgrade", "head", check=False)
    assert failed.returncode != 0
    assert "Duplicate IM message identities" in failed.stderr

    asyncio.run(execute(postgres_url, "TRUNCATE TABLE im_messages"))
    run_alembic("upgrade", "head")
    assert asyncio.run(metadata_diff(postgres_url)) == []
