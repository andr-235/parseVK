import re
from typing import Any

from app.core.config import settings

_REGISTERED_SECRETS: set[str] = set()


def register_secret(secret: str) -> None:
    """Register a runtime-loaded secret for redaction."""
    if secret and len(secret) > 4:
        _REGISTERED_SECRETS.add(secret)


def redact_secrets(text: Any) -> str:
    """Redact sensitive values from logs, errors, and JSON responses."""
    if text is None:
        return ""
    text_str = str(text)
    if not text_str:
        return text_str

    secrets_to_redact = [
        value
        for value in (
            settings.ok_access_token,
            settings.ok_application_secret_key,
            settings.internal_service_token,
        )
        if value
    ]
    secrets_to_redact.extend(_REGISTERED_SECRETS)

    for secret in secrets_to_redact:
        if len(secret) > 4:
            text_str = text_str.replace(secret, "<redacted>")

    text_str = re.sub(
        r"(?i)(authorization:\s*)[^\r\n]+",
        r"\1<redacted>",
        text_str,
    )
    text_str = re.sub(
        r"(?i)(cookie:\s*)[^\r\n]+",
        r"\1<redacted>",
        text_str,
    )
    return re.sub(
        r"(?i)(access_token|session_key|sig|token)=[^&\s]+",
        r"\1=<redacted>",
        text_str,
    )
