import logging

from app.core.config import settings
from app.domain.ports.secret_provider import SecretProvider
from app.infrastructure.secrets.env_provider import EnvSecretProvider
from app.infrastructure.secrets.file_provider import FileSecretProvider

logger = logging.getLogger(__name__)


def build_secret_provider(cfg: object | None = None) -> SecretProvider:
    """Selects the secret provider: mounted file wins, env is the legacy path."""
    resolved = cfg or settings
    if resolved.token_file:
        logger.info("secret source: file (%s)", resolved.token_file)
        return FileSecretProvider(resolved.token_file)
    logger.warning(
        "VK_SERVICE_TOKEN_FILE is not set; falling back to legacy "
        "VK_SERVICE_VK_TOKEN env (deprecated)"
    )
    return EnvSecretProvider(resolved)
