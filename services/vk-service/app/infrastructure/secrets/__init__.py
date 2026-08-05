from app.core.config import settings
from app.domain.ports.secret_provider import SecretProvider
from app.infrastructure.secrets.file_provider import FileSecretProvider


def build_secret_provider(cfg: object | None = None) -> SecretProvider:
    """Build the only supported VK credential source: a mounted file."""
    resolved = cfg or settings
    return FileSecretProvider(resolved.token_file)
