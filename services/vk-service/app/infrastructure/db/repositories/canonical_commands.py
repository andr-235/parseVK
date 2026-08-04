"""Repository facade for the single canonical VK command runtime."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.source_collections import (
    CommandAttachmentResult,
    TaskRunBinding,
)
from app.infrastructure.db.repositories.canonical_command_attachment import (
    attach_command as attach_task_run,
)
from app.infrastructure.db.repositories.canonical_command_cancellation import (
    request_cancellation as cancel_task_run,
)
from app.infrastructure.db.repositories.canonical_command_events import (
    emit_rejection as add_rejection_event,
)


class CanonicalVkCommandRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def attach_command(self, command) -> CommandAttachmentResult:
        return await attach_task_run(self.session, command)

    async def emit_rejection(self, command, reason: str) -> None:
        add_rejection_event(self.session, command, reason)

    async def request_cancellation(self, command) -> TaskRunBinding | None:
        return await cancel_task_run(self.session, command)
