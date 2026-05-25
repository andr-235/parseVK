from common.errors import build_error


def test_build_error_envelope():
    envelope = build_error("unauthorized", "Unauthorized", request_id="req-1")

    assert envelope.request_id == "req-1"
    assert envelope.error.code == "unauthorized"
