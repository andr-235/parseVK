from common.logging import REDACTED_VALUE, is_sensitive_key, redact_sensitive


def test_telegram_sensitive_keys_are_detected_case_insensitively():
    for key in [
        "session",
        "sessionString",
        "authKey",
        "phone",
        "phoneCode",
        "password",
        "token",
        "cookie",
        "apiHash",
        "apiId",
    ]:
        assert is_sensitive_key(key)


def test_redact_sensitive_replaces_nested_telegram_values():
    payload = {
        "safe": "visible",
        "sessionString": "secret-session",
        "nested": {
            "apiHash": "secret-hash",
            "items": [{"phoneCode": "12345"}, {"name": "kept"}],
        },
    }

    assert redact_sensitive(payload) == {
        "safe": "visible",
        "sessionString": REDACTED_VALUE,
        "nested": {
            "apiHash": REDACTED_VALUE,
            "items": [{"phoneCode": REDACTED_VALUE}, {"name": "kept"}],
        },
    }
