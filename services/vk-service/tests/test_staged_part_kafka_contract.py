from pathlib import Path

from app.core.config import Settings
from app.domain.entities.ingestion_part_identity import APPLICATION_HARD_LIMIT_BYTES

ROOT = Path(__file__).resolve().parents[3]
COMPOSE = ROOT / "docker-compose.yml"


def test_compose_provisions_ingestion_topic_and_dlq() -> None:
    compose = COMPOSE.read_text(encoding="utf-8")

    for topic in (
        "parsevk.content.ingestion.vk",
        "parsevk.content.ingestion.vk.dlq",
    ):
        assert f"--topic {topic}" in compose
    assert compose.count("--config max.message.bytes=1048576") >= 2
    assert "VK_SERVICE_STAGED_PART_PUBLISHER_ENABLED" in compose
    assert "VK_SERVICE_KAFKA_TOPIC_VK_INGESTION" in compose
    assert "VK_SERVICE_KAFKA_TOPIC_VK_INGESTION_DLQ" in compose
    assert "VK_SERVICE_STAGED_PART_PRODUCER_MAX_REQUEST_BYTES" in compose


def test_transport_limits_exceed_application_hard_limit() -> None:
    settings = Settings()

    assert APPLICATION_HARD_LIMIT_BYTES == 768 * 1024
    assert settings.staged_part_producer_max_request_bytes >= (
        APPLICATION_HARD_LIMIT_BYTES
    )
    assert settings.staged_part_producer_max_request_bytes == 1_048_576
