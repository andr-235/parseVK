class ProviderAccountBlockedError(RuntimeError):
    """The provider account is not active; execution must not call the provider."""
