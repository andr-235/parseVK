"""Tests for JSON fixtures."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from parsevk_contracts.envelope import MessageEnvelope
from parsevk_contracts.vk.commands import VkExecutionRequested
from pydantic import ValidationError

from tests.fixtures import load_fixture

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "examples"


class TestFixtureLoading:
    def test_all_fixtures_exist(self) -> None:
        """All expected fixture files exist on disk."""
        cases = [
            "valid-single-demand",
            "valid-multiple-demands",
            "consume-extra-field",
            "invalid-owner-id",
            "invalid-empty-demands",
            "invalid-snapshot-sha256",
            "invalid-owner-external-mismatch",
        ]
        for case in cases:
            path = FIXTURES_DIR / "vk.execution.requested" / "v1" / f"{case}.json"
            assert path.exists(), f"Missing fixture: {path}"

    def test_fixtures_are_valid_json(self) -> None:
        """All fixture files contain valid JSON."""
        for path in sorted((FIXTURES_DIR / "vk.execution.requested" / "v1").iterdir()):
            with open(path) as f:
                data = json.load(f)
            assert isinstance(data, dict)

    def test_fixtures_deterministic(self) -> None:
        """Repeated reads return identical data."""
        data1 = load_fixture("vk.execution.requested", 1, "valid-single-demand")
        data2 = load_fixture("vk.execution.requested", 1, "valid-single-demand")
        assert data1 == data2


class TestValidFixtures:
    def test_valid_single_demand(self) -> None:
        """Valid single-demand fixture can be parsed as envelope."""
        data = load_fixture("vk.execution.requested", 1, "valid-single-demand")
        envelope = MessageEnvelope[VkExecutionRequested].model_validate(data)
        assert envelope.message_type == "vk.execution.requested"
        assert len(envelope.payload.demands) == 1

    def test_valid_multiple_demands(self) -> None:
        """Valid multiple-demands fixture can be parsed as envelope."""
        data = load_fixture("vk.execution.requested", 1, "valid-multiple-demands")
        envelope = MessageEnvelope[VkExecutionRequested].model_validate(data)
        assert envelope.message_type == "vk.execution.requested"
        assert len(envelope.payload.demands) == 2

    def test_consume_extra_field(self) -> None:
        """Consumer can parse envelope with extra fields (extra='ignore')."""
        data = load_fixture("vk.execution.requested", 1, "consume-extra-field")
        envelope = MessageEnvelope[VkExecutionRequested].model_validate(
            data, extra="ignore"
        )
        assert envelope.message_type == "vk.execution.requested"


class TestInvalidFixtures:
    def test_invalid_owner_id(self) -> None:
        """Positive owner_id fixture raises validation error."""
        data = load_fixture("vk.execution.requested", 1, "invalid-owner-id")
        with pytest.raises(ValidationError):
            MessageEnvelope[VkExecutionRequested].model_validate(data)

    def test_invalid_empty_demands(self) -> None:
        """Empty demands fixture raises validation error."""
        data = load_fixture("vk.execution.requested", 1, "invalid-empty-demands")
        with pytest.raises(ValidationError):
            MessageEnvelope[VkExecutionRequested].model_validate(data)

    def test_invalid_snapshot_sha256(self) -> None:
        """Invalid sha256 fixture raises validation error."""
        data = load_fixture("vk.execution.requested", 1, "invalid-snapshot-sha256")
        with pytest.raises(ValidationError):
            MessageEnvelope[VkExecutionRequested].model_validate(data)

    def test_invalid_owner_external_mismatch(self) -> None:
        """Owner-external mismatch fixture raises validation error."""
        data = load_fixture("vk.execution.requested", 1, "invalid-owner-external-mismatch")
        with pytest.raises(ValidationError):
            MessageEnvelope[VkExecutionRequested].model_validate(data)
