from __future__ import annotations

from collections.abc import Iterable


async def verify_staged_ingestion_topology(
    *,
    bootstrap_servers: str,
    topic: str,
    dlq_topic: str,
    min_message_bytes: int,
) -> None:
    if not bootstrap_servers:
        raise RuntimeError("Kafka bootstrap servers must not be empty")
    if not topic or not dlq_topic:
        raise RuntimeError("staged ingestion Kafka topics must not be empty")
    if min_message_bytes < 1:
        raise RuntimeError("staged ingestion Kafka message limit must be positive")

    from aiokafka.admin import (
        AIOKafkaAdminClient,
        ConfigResource,
        ConfigResourceType,
    )

    admin = AIOKafkaAdminClient(bootstrap_servers=bootstrap_servers)
    await admin.start()
    try:
        existing = set(await admin.list_topics())
        required = {topic, dlq_topic}
        missing = sorted(required - existing)
        if missing:
            raise RuntimeError(
                "required staged ingestion Kafka topics are missing: "
                + ", ".join(missing)
            )

        resources = [
            ConfigResource(
                ConfigResourceType.TOPIC,
                name,
                configs={"max.message.bytes": None},
            )
            for name in (topic, dlq_topic)
        ]
        responses = await admin.describe_configs(resources)
        limits = _extract_topic_message_limits(responses)

        for name in (topic, dlq_topic):
            limit = limits.get(name)
            if limit is None:
                raise RuntimeError(
                    f"Kafka topic {name} does not expose max.message.bytes"
                )
            if limit < min_message_bytes:
                raise RuntimeError(
                    f"Kafka topic {name} max.message.bytes={limit} is below "
                    f"required {min_message_bytes}"
                )
    finally:
        await admin.close()


def _extract_topic_message_limits(responses: Iterable[object]) -> dict[str, int]:
    limits: dict[str, int] = {}
    for response in responses:
        to_object = getattr(response, "to_object", None)
        if to_object is None:
            raise RuntimeError("Kafka DescribeConfigs response is not inspectable")
        payload = to_object()
        for resource in payload.get("resources", []):
            error_code = resource.get("error_code", 0)
            if error_code:
                name = resource.get("resource_name", "<unknown>")
                message = resource.get("error_message") or "unknown Kafka error"
                raise RuntimeError(
                    f"unable to describe Kafka topic {name}: {message}"
                )

            name = resource.get("resource_name")
            if not name:
                continue
            for entry in resource.get("config_entries", []):
                config_name = (
                    entry.get("config_name")
                    or entry.get("config_names")
                    or entry.get("name")
                )
                if config_name != "max.message.bytes":
                    continue
                raw_value = entry.get("config_value", entry.get("value"))
                if raw_value is None:
                    continue
                try:
                    limits[name] = int(raw_value)
                except (TypeError, ValueError) as error:
                    raise RuntimeError(
                        f"Kafka topic {name} has invalid max.message.bytes={raw_value!r}"
                    ) from error
    return limits
