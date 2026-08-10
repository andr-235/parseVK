import aiokafka.admin
import pytest

from app.services.ingestion.kafka_topology import verify_staged_ingestion_topology


class _DescribeConfigsResponse:
    def __init__(self, limits: dict[str, int]) -> None:
        self._limits = limits

    def to_object(self) -> dict:
        return {
            "resources": [
                {
                    "error_code": 0,
                    "error_message": None,
                    "resource_name": name,
                    "config_entries": [
                        {
                            "config_names": "max.message.bytes",
                            "config_value": str(limit),
                        }
                    ],
                }
                for name, limit in self._limits.items()
            ]
        }


class _FakeAdminClient:
    limits = {
        "parsevk.content.ingestion.vk": 1_048_576,
        "parsevk.content.ingestion.vk.dlq": 1_048_576,
    }
    last_instance = None

    def __init__(self, *, bootstrap_servers: str) -> None:
        self.bootstrap_servers = bootstrap_servers
        self.closed = False
        type(self).last_instance = self

    async def start(self) -> None:
        return None

    async def close(self) -> None:
        self.closed = True

    async def list_topics(self) -> list[str]:
        return list(self.limits)

    async def describe_configs(self, resources) -> list[_DescribeConfigsResponse]:
        assert {resource.name for resource in resources} == set(self.limits)
        return [_DescribeConfigsResponse(self.limits)]


@pytest.mark.anyio
async def test_staged_kafka_topology_uses_real_admin_config_resource_import(
    monkeypatch,
) -> None:
    _FakeAdminClient.limits = {
        "parsevk.content.ingestion.vk": 1_048_576,
        "parsevk.content.ingestion.vk.dlq": 1_048_576,
    }
    monkeypatch.setattr(aiokafka.admin, "AIOKafkaAdminClient", _FakeAdminClient)

    await verify_staged_ingestion_topology(
        bootstrap_servers="kafka:9092",
        topic="parsevk.content.ingestion.vk",
        dlq_topic="parsevk.content.ingestion.vk.dlq",
        min_message_bytes=1_048_576,
    )

    assert _FakeAdminClient.last_instance is not None
    assert _FakeAdminClient.last_instance.closed is True


@pytest.mark.anyio
async def test_staged_kafka_topology_rejects_undersized_topic(monkeypatch) -> None:
    _FakeAdminClient.limits = {
        "parsevk.content.ingestion.vk": 900_000,
        "parsevk.content.ingestion.vk.dlq": 1_048_576,
    }
    monkeypatch.setattr(aiokafka.admin, "AIOKafkaAdminClient", _FakeAdminClient)

    with pytest.raises(RuntimeError, match="max.message.bytes=900000"):
        await verify_staged_ingestion_topology(
            bootstrap_servers="kafka:9092",
            topic="parsevk.content.ingestion.vk",
            dlq_topic="parsevk.content.ingestion.vk.dlq",
            min_message_bytes=1_048_576,
        )

    assert _FakeAdminClient.last_instance is not None
    assert _FakeAdminClient.last_instance.closed is True
