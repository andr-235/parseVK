SENSITIVE_HEADERS = {"authorization", "set-cookie", "cookie"}
SENSITIVE_FIELDS = {"password", "password_hash", "access_token", "refresh_token", "private_key"}


def is_sensitive_key(key: str) -> bool:
    return key.lower() in SENSITIVE_HEADERS or key.lower() in SENSITIVE_FIELDS
