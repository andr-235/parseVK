"""Tests for ContractModel base class."""

from __future__ import annotations

from uuid import uuid4

import pytest
from pydantic import Field

from parsevk_contracts._base import ContractModel


class SampleModel(ContractModel):
    name: str
    count: int
    is_active: bool = True


class TestContractModel:
    def test_round_trip_identity(self) -> None:
        """Serializing and deserializing produces identical data."""
        original = SampleModel(name="test", count=42, is_active=True)
        wire = original.to_wire()
        restored = SampleModel.from_wire(wire)
        assert restored == original

    def test_camel_case_wire(self) -> None:
        """Wire format uses camelCase keys."""
        model = SampleModel(name="hello", count=7)
        wire = model.to_wire()
        assert "name" in wire
        assert "count" in wire
        assert "isActive" in wire
        assert "is_active" not in wire

    def test_snake_case_construction(self) -> None:
        """Can construct with snake_case field names."""
        model = SampleModel(name="x", count=1)
        assert model.name == "x"
        assert model.count == 1

    def test_camel_case_construction(self) -> None:
        """Can construct with camelCase field names (populate_by_name=True)."""
        model = SampleModel.model_validate({"name": "x", "count": 1, "isActive": True})
        assert model.name == "x"
        assert model.is_active is True

    def test_frozen_immutable(self) -> None:
        """Cannot modify fields after construction."""
        model = SampleModel(name="x", count=1)
        with pytest.raises(ValueError, match="frozen"):
            model.name = "y"  # type: ignore[misc]

    def test_to_wire_json(self) -> None:
        """to_wire_json produces valid JSON with camelCase keys."""
        model = SampleModel(name="json", count=3)
        json_str = model.to_wire_json()
        assert '"name"' in json_str
        assert '"isActive"' in json_str
        assert '"is_active"' not in json_str

    def test_from_wire_accepts_snake_case(self) -> None:
        """from_wire accepts snake_case keys too (populate_by_name)."""
        data = {"name": "snake", "count": 10, "is_active": False}
        model = SampleModel.from_wire(data)
        assert model.name == "snake"
        assert model.is_active is False

    def test_uuid_field_round_trip(self) -> None:
        """UUID fields survive JSON serialization round-trip."""

        class ModelWithUuid(ContractModel):
            id: str
            token: str

        uid = str(uuid4())
        model = ModelWithUuid(id=uid, token="abc")
        wire = model.to_wire()
        restored = ModelWithUuid.from_wire(wire)
        assert restored.id == uid
