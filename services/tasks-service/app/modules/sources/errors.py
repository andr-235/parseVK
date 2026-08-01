"""Sources module domain errors."""


class SourceAccessError(Exception):
    """Business-rule violation in sources module."""


class ScopeNotFoundError(SourceAccessError):
    pass


class TaskNotFoundError(SourceAccessError):
    pass
