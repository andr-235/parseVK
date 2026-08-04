"""Composition root for tasks-service.

Creates service instances with all dependencies wired.
One session per use case — all repositories share the same AsyncSession.
Accepts an optional AIOKafkaProducer for outbox publishing.
"""

import logging
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.outbox.service import OutboxService

if TYPE_CHECKING:
    from aiokafka import AIOKafkaProducer

    from app.modules.automation.service import AutomationService
    from app.modules.outbox.publisher import OutboxPublisher
from app.modules.tasks.crud_service import TasksCrudService
from app.modules.tasks.repository import TasksRepository
from app.modules.tasks.service import TasksService
from app.modules.tasks.state_service import TaskStateService

logger = logging.getLogger(__name__)


class ApplicationFactory:
    """Composition root for tasks-service.

    One session per use case — all repositories share the same AsyncSession.
    Accepts an optional AIOKafkaProducer for outbox publishing.
    """

    def __init__(
        self,
        session: AsyncSession,
        *,
        producer: "AIOKafkaProducer | None" = None,
    ):
        self.session = session
        self.producer = producer

    def _create_repository(self) -> TasksRepository:
        return TasksRepository(self.session)

    def _create_outbox(self) -> OutboxService:
        return OutboxService(self.session)

    def create_outbox_publisher(self) -> "OutboxPublisher":
        """Create the routed tasks/VK command outbox publisher."""
        from app.core.config import settings
        from app.modules.outbox.publisher import (
            OutboxPublisher,
            TasksOutboxRepositoryAdapter,
            dlq_topic_for_event,
            kafka_key_for_event,
            topic_for_event,
        )
        from app.modules.outbox.repository import OutboxRepository

        logger.debug("OutboxPublisher created via factory")
        return OutboxPublisher(
            repository=TasksOutboxRepositoryAdapter(
                OutboxRepository(self.session)
            ),
            producer=self.producer,
            topic=settings.kafka_topic_tasks,
            dlq_topic=settings.kafka_topic_tasks_dlq,
            namespace="tasks",
            key_fn=lambda msg: kafka_key_for_event(
                msg.event_type,
                msg.payload,
                msg.aggregate_id,
            ),
            topic_fn=lambda msg: topic_for_event(msg, settings),
            dlq_topic_fn=lambda msg: dlq_topic_for_event(msg, settings),
        )

    def create_tasks_service(self) -> TasksService:
        repo = self._create_repository()
        outbox = self._create_outbox()
        logger.debug("ApplicationFactory: created TasksService with sub-services")
        return TasksService(
            crud=TasksCrudService(self.session, repo, outbox),
            state=TaskStateService(self.session, repo, outbox),
        )

    def create_automation_service(self) -> "AutomationService":
        from app.modules.automation.repository import AutomationRepository
        from app.modules.automation.service import AutomationService

        logger.debug("ApplicationFactory: created AutomationService")
        return AutomationService(
            session=self.session,
            repository=AutomationRepository(self.session),
            tasks=TasksRepository(self.session),
            outbox=self._create_outbox(),
        )

    def create_sources_service(self):
        from app.modules.sources.repository import SourcesRepository
        from app.modules.sources.resolver import InternalVkSourceResolver
        from app.modules.sources.service import SourcesService

        logger.debug("ApplicationFactory: created SourcesService")
        return SourcesService(
            session=self.session,
            resolver=InternalVkSourceResolver(),
            sources_repo=SourcesRepository(self.session),
            tasks_repo=TasksRepository(self.session),
        )

    def create_access_scope_service(self):
        from app.modules.sources.resolver import InternalVkSourceResolver
        from app.modules.sources.scope_service import AccessScopeService

        logger.debug("ApplicationFactory: created AccessScopeService")
        return AccessScopeService(
            session=self.session,
            resolver=InternalVkSourceResolver(),
        )
