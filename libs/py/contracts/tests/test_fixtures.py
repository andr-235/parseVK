"""Tests for JSON fixtures."""
from __future__ import annotations

import json
from pathlib import Path

import jsonschema
import pytest
from parsevk_contracts.envelope import MessageEnvelope
from parsevk_contracts.generation.json_schema import generate_json_schema
from parsevk_contracts.vk.commands import VK_EXECUTION_REQUESTED, VkExecutionRequested
from pydantic import ValidationError

from tests.fixtures import load_fixture

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "examples"
PILOT_PATH = FIXTURES_DIR / "vk.execution.requested" / "v1"


class TestFixtureLoading:
    def test_all_fixtures_exist(self) -> None:
        expected = [
            "valid-single-demand",
            "valid-multiple-demands",
            "consume-extra-field",
            "invalid-schema-owner-id",
            "invalid-schema-empty-demands",
            "invalid-schema-snapshot-sha256",
            "invalid-contract-owner-external-mismatch",
        ]
        for case in expected:
            path = PILOT_PATH / f"{case}.json"
            assert path.exists(), f"Missing fixture: {path}"

    def test_fixtures_are_valid_json(self) -> None:
        for path in sorted(PILOT_PATH.iterdir()):
            with open(path) as f:
                data = json.load(f)
            assert isinstance(data, dict)

    def test_fixtures_deterministic(self) -> None:
        data1 = load_fixture("vk.execution.requested", 1, "valid-single-demand")
        data2 = load_fixture("vk.execution.requested", 1, "valid-single-demand")
        assert data1 == data2


class TestValidFixtures:
    def test_valid_single_demand(self) -> None:
        data = load_fixture("vk.execution.requested", 1, "valid-single-demand")
        envelope = MessageEnvelope[VkExecutionRequested].model_validate(data)
        assert envelope.message_type == "vk.execution.requested"
        assert len(envelope.payload.demands) == 1

    def test_valid_multiple_demands(self) -> None:
        data = load_fixture("vk.execution.requested", 1, "valid-multiple-demands")
        envelope = MessageEnvelope[VkExecutionRequested].model_validate(data)
        assert envelope.message_type == "vk.execution.requested"
        assert len(envelope.payload.demands) == 2

    def test_consume_extra_field(self) -> None:
        data = load_fixture("vk.execution.requested", 1, "consume-extra-field")
        envelope = MessageEnvelope[VkExecutionRequested].model_validate(
            data, extra="ignore"
        )
        assert envelope.message_type == "vk.execution.requested"

    def test_valid_fixtures_pass_json_schema(self) -> None:
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        validator = jsonschema.Draft202012Validator(
            schema, format_checker=jsonschema.FormatChecker(),
        )
        for case in ["valid-single-demand", "valid-multiple-demands"]:
            data = load_fixture("vk.execution.requested", 1, case)
            validator.validate(data)


class TestInvalidSchemaFixtures:
    def test_invalid_owner_id(self) -> None:
        data = load_fixture("vk.execution.requested", 1, "invalid-schema-owner-id")
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        validator = jsonschema.Draft202012Validator(
            schema, format_checker=jsonschema.FormatChecker(),
        )
        with pytest.raises(jsonschema.ValidationError):
            validator.validate(data)

    def test_invalid_empty_demands(self) -> None:
        data = load_fixture("vk.execution.requested", 1, "invalid-schema-empty-demands")
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        validator = jsonschema.Draft202012Validator(
            schema, format_checker=jsonschema.FormatChecker(),
        )
        with pytest.raises(jsonschema.ValidationError):
            validator.validate(data)

    def test_invalid_snapshot_sha256(self) -> None:
        data = load_fixture("vk.execution.requested", 1, "invalid-schema-snapshot-sha256")
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        validator = jsonschema.Draft202012Validator(
            schema, format_checker=jsonschema.FormatChecker(),
        )
        with pytest.raises(jsonschema.ValidationError):
            validator.validate(data)


class TestInvalidContractFixtures:
    def test_invalid_owner_external_mismatch(self) -> None:
        data = load_fixture("vk.execution.requested", 1, "invalid-contract-owner-external-mismatch")
        with pytest.raises(ValidationError):
            MessageEnvelope[VkExecutionRequested].model_validate(data)
