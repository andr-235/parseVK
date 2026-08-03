class ProviderAccountBlockedError(RuntimeError):
    """The provider account is not active; execution must not call the provider."""


class ProviderCredentialChangedError(ProviderAccountBlockedError):
    """The mounted credential no longer matches the claimed account version."""
