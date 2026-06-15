from common.logging import is_sensitive_key


def should_redact(key: str) -> bool:
    return is_sensitive_key(key)
