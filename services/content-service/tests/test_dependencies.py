from unittest.mock import AsyncMock

import pytest
from app.bootstrap import ContentContainer
from app.services.content.authors import AuthorQueryService
from app.services.content.groups import GroupService
from app.services.monitoring.groups import MonitoringGroupService


@pytest.mark.anyio
async def test_container_builds_focused_services():
    container = ContentContainer()
    session = AsyncMock()
    try:
        assert isinstance(container.author_query(session), AuthorQueryService)
        assert isinstance(container.groups(session), GroupService)
        assert isinstance(
            container.monitoring_groups(session),
            MonitoringGroupService,
        )
    finally:
        await container.close()
