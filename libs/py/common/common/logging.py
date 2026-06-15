from typing import Any

REDACTED_VALUE = "<redacted>"

SENSITIVE_HEADERS = {"authorization", "set-cookie", "cookie"}
SENSITIVE_FIELDS = {
    "access_token",
    "api_hash",
    "api_id",
    "apihash",
    "apiid",
    "auth_key",
    "authkey",
    "cookie",
    "password",
    "password_hash",
    "phone",
    "phone_code",
    "phonecode",
    "private_key",
    "refresh_token",
    "session",
    "session_string",
    "sessionstring",
    "token",
}


def is_sensitive_key(key: str) -> bool:
    normalized = key.lower()
    return normalized in SENSITIVE_HEADERS or normalized in SENSITIVE_FIELDS


def redact_sensitive(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: REDACTED_VALUE if is_sensitive_key(str(key)) else redact_sensitive(item)
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [redact_sensitive(item) for item in value]
    if isinstance(value, tuple):
        return tuple(redact_sensitive(item) for item in value)
    return value
