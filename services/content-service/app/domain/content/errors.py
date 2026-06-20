class ContentDomainError(Exception):
    def __init__(self, message: str, *, context: dict | None = None):
        super().__init__(message)
        self.context = context or {}


class EntityNotFoundError(ContentDomainError):
    def __init__(self, entity: str, identifier: str | int):
        super().__init__(
            f"{entity} not found",
            context={"entity": entity, "identifier": identifier},
        )


class InvalidFilterError(ContentDomainError):
    def __init__(self, field: str, value: object):
        super().__init__(
            f"Unsupported {field}",
            context={"field": field, "value": value},
        )


class ExternalServiceUnavailableError(ContentDomainError):
    def __init__(self, service: str):
        super().__init__(
            f"{service} is unavailable",
            context={"service": service},
        )
