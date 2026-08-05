"""Deterministic locks shared by canonical VK command handlers."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def advisory_lock(session: AsyncSession, lock_key: str) -> None:
    bind = session.get_bind()
    if bind.dialect.name != "postgresql":
        return
    await session.execute(
        text("SELECT pg_advisory_xact_lock(hashtext(:lock_key))"),
        {"lock_key": lock_key},
    )
