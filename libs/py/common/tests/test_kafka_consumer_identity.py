from common.kafka.consumer import BaseEventConsumer


def test_message_identity_reads_legacy_wire_event():
    assert BaseEventConsumer._message_identity(
        {
            "event_id": "legacy-id",
            "event_type": "task.created",
        }
    ) == ("legacy-id", "task.created")


def test_message_identity_reads_canonical_contract_envelope():
    assert BaseEventConsumer._message_identity(
        {
            "messageId": "canonical-id",
            "messageType": "vk.execution.requested",
        }
    ) == ("canonical-id", "vk.execution.requested")


def test_message_identity_rejects_unidentified_payload():
    assert BaseEventConsumer._message_identity({"payload": {}}) == (None, "")
