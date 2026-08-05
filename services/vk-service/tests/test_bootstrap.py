"""Tests for canonical vk-service dependency injection wiring."""

from unittest.mock import AsyncMock

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
