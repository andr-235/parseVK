import re
from typing import Any
from app.core.config import settings

def redact_secrets(text: Any) -> str:
    """
    Universally redacts sensitive keys and values from logs, errors, and JSON responses.
    """
    if text is None:
        return ""
    
    text_str = str(text)
    if not text_str:
        return text_str

    secrets_to_redact = []
    
    # Collect gateway specific secrets
    if hasattr(settings, "internal_service_token") and settings.internal_service_token:
        secrets_to_redact.append(settings.internal_service_token)

    for secret in secrets_to_redact:
        if secret and len(secret) > 4:
            text_str = text_str.replace(secret, "<redacted>")

    # Redact Authorization header values
    text_str = re.sub(r"(?i)(authorization:\s*)[^\r\n]+", r"\1<redacted>", text_str)
    
    # Redact Cookies
    text_str = re.sub(r"(?i)(cookie:\s*)[^\r\n]+", r"\1<redacted>", text_str)

    # Redact URL parameters commonly housing keys
    text_str = re.sub(r"(?i)(access_token|session_key|sig|token)=[^&\s]+", r"\1=<redacted>", text_str)

    return text_str
