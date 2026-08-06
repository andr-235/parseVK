"""Tests for canonical vk-service dependency injection wiring."""

from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import UUID

from app.bootstrap import get_ingestion_service, get_vk_client
from app.infrastructure.vk_client.client import VkApiClient


def test_get_vk_client_returns_shared_facade():
    client = get_vk_client()

    assert isinstance(client, VkApiClient)
    assert get_vk_client() is client


def test_get_ingestion_service_accepts_adapter_override():
    bound_adapter = AsyncMock()
    service = get_ingestion_service(AsyncMock(), adapter=bound_adapter)

    assert service.adapter is bound_adapter
    assert service.collector.adapter is bound_adapter
    assert service.collector.post_collector.require_staging is True


def test_get_ingestion_service_binds_physical_staging_to_attempt_claim():
    claim = SimpleNamespace(
        execution_id=UUID("11111111-1111-1111-1111-111111111111"),
        attempt_id=UUID("22222222-2222-2222-2222-222222222222"),
        fencing_token=9,
    )
    control = SimpleNamespace(claim=claim)

    service = get_ingestion_service(
        AsyncMock(),
        adapter=AsyncMock(),
        attempt_control=control,
    )
    staging = service.collector.post_collector.staging

    assert staging is service.collector.comment_collector.staging
    assert staging.execution_id == claim.execution_id
    assert staging.attempt_id == claim.attempt_id
    assert staging.fencing_token == claim.fencing_token
