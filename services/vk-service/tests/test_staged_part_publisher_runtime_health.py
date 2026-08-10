import pytest

from app.services.ingestion.part_publisher import PartPublishResult
from app.tasks import staged_part_publisher as runtime

pytestmark = pytest.mark.anyio


class FakeProducer:
    def __init__(self) -> None:
        self.started = False
        self.stopped = False

    async def start(self) -> None:
        self.started = True

    async def stop(self) -> None:
        self.stopped = True


class FakePublisher:
    worker_id = "runtime-health-test"

    async def publish_once(self) -> PartPublishResult:
        return PartPublishResult()


async def test_runtime_topology_failure_clears_readiness(monkeypatch) -> None:
    import aiokafka

    producer = FakeProducer()
    health = [False]
    checks = 0

    async def verify_topology() -> None:
        nonlocal checks
        checks += 1
        if checks == 2:
            raise RuntimeError("Kafka topology changed")

    monkeypatch.setattr(aiokafka, "AIOKafkaProducer", lambda **_kwargs: producer)
    monkeypatch.setattr(runtime, "_build_publisher", lambda *_args: FakePublisher())
    monkeypatch.setattr(runtime, "_verify_topology", verify_topology)
    monkeypatch.setattr(runtime, "TOPOLOGY_RECHECK_SECONDS", 0.0)
    monkeypatch.setattr(runtime.settings, "staged_part_publisher_poll_seconds", 0.0)

    with pytest.raises(RuntimeError, match="Kafka topology changed"):
        await runtime.publish_staged_parts_forever(
            object(),
            health_flag=health,
        )

    assert checks == 2
    assert health == [False]
    assert producer.started is True
    assert producer.stopped is True
