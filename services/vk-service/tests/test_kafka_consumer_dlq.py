from common.kafka.consumer_dlq import (
    MAX_FAILURE_REASON_BYTES,
    build_dlq_headers,
)


def test_failure_reason_is_truncated_on_utf8_boundary():
    reason = "a" + "Я" * 1000

    headers = dict(
        build_dlq_headers(
            consumer_name="vk-service-vk-commands",
            original_topic="parsevk.vk.commands",
            failure_reason=reason,
        )
    )
    encoded = headers["failure_reason"]

    assert len(encoded) <= MAX_FAILURE_REASON_BYTES
    assert encoded.decode("utf-8") == "a" + "Я" * 999
