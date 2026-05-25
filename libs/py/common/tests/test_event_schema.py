from datetime import datetime
from uuid import UUID

from common.events import EventEnvelope


def test_event_envelope_schema_contains_required_fields():
    event = EventEnvelope(
        event_type="identity.user_logged_in",
        producer="identity-service",
        correlation_id="corr-1",
        payload={"user_id": "u1"},
    )

    assert isinstance(event.event_id, UUID)
    assert event.event_type == "identity.user_logged_in"
    assert event.event_version == 1
    assert isinstance(event.occurred_at, datetime)
    assert event.producer == "identity-service"
    assert event.correlation_id == "corr-1"
    assert event.payload == {"user_id": "u1"}
    assert event.to_json_bytes().startswith(b"{")
