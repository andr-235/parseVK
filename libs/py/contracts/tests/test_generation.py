"""Tests for JSON Schema and manifest generation."""

from __future__ import annotations

import json
from pathlib import Path

import jsonschema

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import ContractCatalog, MessageContract
from parsevk_contracts.generation import generate_all
from parsevk_contracts.generation.json_schema import generate_json_schema
from parsevk_contracts.generation.manifest import generate_manifest
from parsevk_contracts.vk.commands import CATALOG as VK_CATALOG
from parsevk_contracts.vk.commands import (
    VK_EXECUTION_CANCEL_REQUESTED,
    VK_EXECUTION_REQUESTED,
)


class TestJsonSchemaGeneration:
    def test_generates_valid_schema(self) -> None:
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        jsonschema.Draft202012Validator.check_schema(schema)

    def test_schema_has_correct_title(self) -> None:
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        assert schema["title"] == "vk.execution.requested"

    def test_schema_includes_unversioned_envelope_fields(self) -> None:
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        properties = schema.get("properties", {})
        assert {
            "messageId",
            "messageType",
            "occurredAt",
            "producer",
            "payload",
        }.issubset(properties)
        assert "schemaVersion" not in properties

    def test_execution_request_requires_owner_user_id(self) -> None:
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        payload_ref = schema["properties"]["payload"]["$ref"]
        definition = payload_ref.rsplit("/", 1)[-1]
        payload_schema = schema["$defs"][definition]
        assert "ownerUserId" in payload_schema["required"]

    def test_cancellation_schema_is_valid(self) -> None:
        schema = generate_json_schema(VK_EXECUTION_CANCEL_REQUESTED)
        jsonschema.Draft202012Validator.check_schema(schema)
        assert schema["title"] == "vk.execution.cancel_requested"

    def test_valid_fixture_passes_schema(self) -> None:
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        fixture_path = (
            Path(__file__).resolve().parent.parent
            / "examples"
            / "vk.execution.requested"
            / "valid-single-demand.json"
        )
        with open(fixture_path) as fixture:
            instance = json.load(fixture)
        jsonschema.validate(instance, schema)

    def test_schema_is_deterministic(self) -> None:
        assert generate_json_schema(VK_EXECUTION_REQUESTED) == generate_json_schema(
            VK_EXECUTION_REQUESTED
        )

    def test_correlation_required_is_non_nullable(self) -> None:
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        assert "correlationId" in schema.get("required", [])
        assert schema["properties"]["correlationId"] == {
            "type": "string",
            "format": "uuid",
        }

    def test_causation_forbidden_is_null(self) -> None:
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        assert schema["properties"]["causationId"] == {"type": "null"}


class TestManifestGeneration:
    def test_manifest_contains_only_canonical_vk_commands(self) -> None:
        manifest = generate_manifest(VK_CATALOG)
        contracts = manifest["contracts"]
        assert len(contracts) == 2
        assert {entry["messageType"] for entry in contracts} == {
            "vk.execution.requested",
            "vk.execution.cancel_requested",
        }
        assert all("schemaVersion" not in entry for entry in contracts)
        assert all("compatibility" not in entry for entry in contracts)

    def test_manifest_producers_consumers(self) -> None:
        manifest = generate_manifest(VK_CATALOG)
        for entry in manifest["contracts"]:
            assert "tasks-service" in entry["producers"]
            assert "vk-service" in entry["consumers"]

    def test_manifest_partition_key(self) -> None:
        manifest = generate_manifest(VK_CATALOG)
        for entry in manifest["contracts"]:
            assert entry["partitionKey"]["paths"] == ["payload.executionId"]
            assert entry["partitionKey"]["separator"] == ":"

    def test_manifest_correlation_path(self) -> None:
        manifest = generate_manifest(VK_CATALOG)
        for entry in manifest["contracts"]:
            assert entry.get("correlationPath") == "payload.executionId"

    def test_manifest_is_deterministic(self) -> None:
        assert generate_manifest(VK_CATALOG) == generate_manifest(VK_CATALOG)

    def test_manifest_multiple_contracts(self) -> None:
        class ExtraPayload(ContractModel):
            id: str

        extra = MessageContract(
            message_type="extra.event",
            payload_model=ExtraPayload,
            topic="extra.topic",
            producers=frozenset({"svc"}),
            consumers=frozenset({"svc"}),
        )
        combined = ContractCatalog.from_contracts(VK_CATALOG.contracts + (extra,))
        manifest = generate_manifest(combined)
        assert len(manifest["contracts"]) == 3


class TestGenerateAll:
    def test_generate_all_creates_files(self, tmp_path: Path) -> None:
        result = generate_all(VK_CATALOG, output_dir=str(tmp_path))
        assert len(result["json_schema"]) == 2
        assert len(result["manifest"]) == 1

        for schema_name in result["json_schema"]:
            schema_path = Path(schema_name)
            assert schema_path.exists()
            with open(schema_path) as schema_file:
                schema = json.load(schema_file)
            assert "$schema" in schema

        manifest_path = Path(result["manifest"][0])
        assert manifest_path.exists()
        with open(manifest_path) as manifest_file:
            manifest = json.load(manifest_file)
        assert "contracts" in manifest

    def test_generated_schemas_are_valid(self, tmp_path: Path) -> None:
        result = generate_all(VK_CATALOG, output_dir=str(tmp_path))
        for schema_name in result["json_schema"]:
            with open(schema_name) as schema_file:
                schema = json.load(schema_file)
            jsonschema.Draft202012Validator.check_schema(schema)
