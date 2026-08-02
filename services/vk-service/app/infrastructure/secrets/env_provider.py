from app.core.config import Settings
from app.core.redaction import register_secret
from app.domain.entities.credentials import CredentialMaterial


class EnvSecretProvider:
    """Legacy provider reading the token from VK_SERVICE_VK_TOKEN."""

    def __init__(self, settings: Settings):
        self._settings = settings

    def load(self) -> CredentialMaterial:
        material = CredentialMaterial.from_secret(self._settings.vk_token)
        register_secret(self._settings.vk_token)
        return material
