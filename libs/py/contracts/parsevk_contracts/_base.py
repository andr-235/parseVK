from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ContractModel(BaseModel):
    """Base model for all contract payloads and envelopes.

    - Wire format: camelCase JSON
    - Python access: snake_case attributes
    - Immutable after construction (frozen=True)
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="forbid",
        frozen=True,
        validate_default=True,
        str_strip_whitespace=True,
    )

    def to_wire(self) -> dict[str, object]:
        """Serialize to camelCase dict for Kafka wire format."""
        return self.model_dump(mode="json", by_alias=True)

    def to_wire_json(self) -> str:
        """Serialize to camelCase JSON string for Kafka wire format."""
        return self.model_dump_json(by_alias=True)

    @classmethod
    def from_wire(cls, data: dict[str, object]) -> ContractModel:
        """Deserialize from camelCase dict (snake_case fields accepted too)."""
        return cls.model_validate(data)
