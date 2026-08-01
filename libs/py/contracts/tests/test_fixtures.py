"""Tests for JSON fixtures."""
from __future__ import annotations

import json
from pathlib import Path

import jsonschema
import pytest
from pydantic import ValidationError

from parsevk_contracts.envelope import MessageEnvelope
from parsevk_contracts.generation.json_schema import generate_json_schema
from parsevk_contracts.sources.events import (
    SOURCE_ACCESS_GRANTED,
    SOURCE_ACCESS_REVOKED,
    SourceAccessGranted,
    SourceAccessRevoked,
)
from parsevk_contracts.vk.commands import VK_EXECUTION_REQUESTED, VkExecutionRequested
from tests.fixtures import load_fixture

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "examples"
PILOT_PATH = FIXTURES_DIR / "vk.execution.requested" / "v1"
SOURCES_DIRS = {
    "sources.access.granted": FIXTURES_DIR / "sources.access.granted" / "v1",
    "sources.access.revoked": FIXTURES_DIR / "sources.access.revoked" / "v1",
}
SOURCE_CONTRACTS = {
    "sources.access.granted": SOURCE_ACCESS_GRANTED,
    "sources.access.revoked": SOURCE_ACCESS_REVOKED,
}
SOURCE_PAYLOAD_MODELS = {
    "sources.access.granted": SourceAccessGranted,
    "sources.access.revoked": SourceAccessRevoked,
}


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


class TestSourceAccessFixtures:
    @pytest.mark.parametrize("message_type", sorted(SOURCES_DIRS))
    def test_all_fixtures_exist(self, message_type: str) -> None:
        """All required source access fixtures exist."""
        expected = [
            "valid-grant" if message_type == "sources.access.granted" else "valid-revoke",
            "consume-extra-field",
            "invalid-schema-owner-id",
            "invalid-schema-revision",
            "invalid-contract-owner-external-mismatch",
            "invalid-contract-scope-user-same",
        ]
        path = SOURCES_DIRS[message_type]
        for case in expected:
            assert (path / f"{case}.json").exists(), f"Missing fixture: {case}"

    @pytest.mark.parametrize("message_type", sorted(SOURCES_DIRS))
    def test_fixtures_are_valid_json(self, message_type: str) -> None:
        for path in sorted(SOURCES_DIRS[message_type].iterdir()):
            with open(path) as f:
                data = json.load(f)
            assert isinstance(data, dict)

    @pytest.mark.parametrize("message_type", sorted(SOURCES_DIRS))
    def test_valid_fixture_loads(self, message_type: str) -> None:
        """Valid fixture passes envelope construction."""
        case = "valid-grant" if message_type == "sources.access.granted" else "valid-revoke"
        data = load_fixture(message_type, 1, case)
        envelope = MessageEnvelope[SOURCE_PAYLOAD_MODELS[message_type]].model_validate(data)
        assert envelope.message_type == message_type

    @pytest.mark.parametrize("message_type", sorted(SOURCES_DIRS))
    def test_consume_extra_field(self, message_type: str) -> None:
        """Extra fields are ignored when consuming."""
        data = load_fixture(message_type, 1, "consume-extra-field")
        envelope = MessageEnvelope[SOURCE_PAYLOAD_MODELS[message_type]].model_validate(
            data, extra="ignore"
        )
        assert envelope.message_type == message_type

    @pytest.mark.parametrize("message_type", sorted(SOURCES_DIRS))
    def test_valid_fixture_passes_json_schema(self, message_type: str) -> None:
        """Valid fixture passes the generated JSON Schema."""
        schema = generate_json_schema(SOURCE_CONTRACTS[message_type])
        validator = jsonschema.Draft202012Validator(
            schema, format_checker=jsonschema.FormatChecker(),
        )
        case = "valid-grant" if message_type == "sources.access.granted" else "valid-revoke"
        data = load_fixture(message_type, 1, case)
        validator.validate(data)

    @pytest.mark.parametrize("message_type", sorted(SOURCES_DIRS))
    def test_invalid_schema_fixtures_rejected(self, message_type: str) -> None:
        """Invalid-schema fixtures fail JSON Schema validation."""
        schema = generate_json_schema(SOURCE_CONTRACTS[message_type])
        validator = jsonschema.Draft202012Validator(
            schema, format_checker=jsonschema.FormatChecker(),
        )
        for case in ["invalid-schema-owner-id", "invalid-schema-revision"]:
            data = load_fixture(message_type, 1, case)
            with pytest.raises(jsonschema.ValidationError):
                validator.validate(data)

    @pytest.mark.parametrize("message_type", sorted(SOURCES_DIRS))
    def test_invalid_contract_fixtures_rejected(self, message_type: str) -> None:
        """Invalid-contract fixtures fail Pydantic contract validation."""
        for case in ["invalid-contract-owner-external-mismatch", "invalid-contract-scope-user-same"]:
            data = load_fixture(message_type, 1, case)
            with pytest.raises(ValidationError):
                MessageEnvelope[SOURCE_PAYLOAD_MODELS[message_type]].model_validate(data)
