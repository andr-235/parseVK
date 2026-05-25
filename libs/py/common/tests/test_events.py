from common.events import EventEnvelope


def test_event_envelope_has_uuid_and_payload():
    event = EventEnvelope(
        event_type="identity.user_created",
        producer="identity-service",
        payload={"user_id": "u1"},
    )

    assert event.event_version == 1
    assert event.payload == {"user_id": "u1"}
    assert str(event.event_id)
