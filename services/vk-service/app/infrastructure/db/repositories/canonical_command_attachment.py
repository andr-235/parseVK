"""Attach one immutable TaskRun command to canonical VK runtime."""

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.source_collections import (
    CommandAttachmentResult,
    SourceDemandAttachment,
)
from app.infrastructure.db.models.source_collections import VkTaskRunBinding
from app.infrastructure.db.repositories.canonical_command_entities import binding_entity
from app.infrastructure.db.repositories.canonical_command_events import utcnow
from app.infrastructure.db.repositories.canonical_command_locks import advisory_lock
from app.infrastructure.db.repositories.canonical_source_attachment import attach_source

ACTIVE_BINDING_STATUSES = ("pending", "running")


async def attach_command(
    session: AsyncSession,
    command,
) -> CommandAttachmentResult:
    await advisory_lock(session, f"task:{command.task_id}")
    existing = await session.scalar(
        select(VkTaskRunBinding)
        .where(
            or_(
                VkTaskRunBinding.command_execution_id == command.execution_id,
                (
                    (VkTaskRunBinding.task_id == command.task_id)
                    & (VkTaskRunBinding.run_id == str(command.task_run_id))
                ),
            )
        )
        .with_for_update()
    )
    if existing is not None:
        if _same_command(existing, command):
            return CommandAttachmentResult(
                outcome="duplicate",
                binding=binding_entity(existing),
                attachments=(),
            )
        return CommandAttachmentResult(
            outcome="conflict",
            binding=binding_entity(existing),
            attachments=(),
            reason="command identity conflicts with an existing TaskRun binding",
        )

    active = await session.scalar(
        select(VkTaskRunBinding)
        .where(
            VkTaskRunBinding.task_id == command.task_id,
            VkTaskRunBinding.status.in_(ACTIVE_BINDING_STATUSES),
        )
        .with_for_update()
    )
    if active is not None:
        return CommandAttachmentResult(
            outcome="conflict",
            binding=binding_entity(active),
            attachments=(),
            reason="another TaskRun for this task is still active",
        )

    now = utcnow()
    binding = VkTaskRunBinding(
        command_execution_id=command.execution_id,
        task_id=command.task_id,
        run_id=str(command.task_run_id),
        owner_user_id=command.owner_user_id,
        task_revision=command.task_revision,
        source_set_revision=command.source_set_revision,
        snapshot_sha256=command.snapshot_sha256,
        expected_demands=len(command.demands),
        status="pending",
        stats={},
        created_at=now,
        updated_at=now,
    )
    session.add(binding)
    await session.flush()

    attachments: list[SourceDemandAttachment] = []
    for requested in command.demands:
        attachments.append(
            await attach_source(
                session,
                binding=binding,
                command=command,
                requested=requested,
            )
        )
    return CommandAttachmentResult(
        outcome="created",
        binding=binding_entity(binding),
        attachments=tuple(attachments),
    )


def _same_command(binding: VkTaskRunBinding, command) -> bool:
    return (
        binding.command_execution_id == command.execution_id
        and binding.task_id == command.task_id
        and binding.run_id == str(command.task_run_id)
        and binding.owner_user_id == command.owner_user_id
        and binding.task_revision == command.task_revision
        and binding.source_set_revision == command.source_set_revision
        and binding.snapshot_sha256 == command.snapshot_sha256
        and binding.expected_demands == len(command.demands)
    )
