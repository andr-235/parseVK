from common.kafka.message_identity import message_identity


def test_message_identity_reads_legacy_wire_event():
    assert message_identity(
        {
            "event_id": "legacy-id",
            "event_type": "task.created",
        }
    ) == ("legacy-id", "task.created")


def test_message_identity_reads_canonical_contract_envelope():
    assert message_identity(
        {
            "messageId": "canonical-id",
            "messageType": "vk.execution.requested",
        }
    ) == ("canonical-id", "vk.execution.requested")


def test_message_identity_rejects_unidentified_payload():
    assert message_identity({"payload": {}}) == (None, "")
