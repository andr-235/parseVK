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
    VK_EXECUTION_REQUESTED,
    VK_EXECUTION_REQUESTED_V2,
)


class TestJsonSchemaGeneration:
    def test_generates_valid_schema(self) -> None:
        """Generated JSON Schema is valid Draft 2020-12."""
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        jsonschema.Draft202012Validator.check_schema(schema)

    def test_schema_has_correct_title(self) -> None:
        """Schema title matches message_type."""
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        assert schema["title"] == "vk.execution.requested"

    def test_schema_includes_envelope_fields(self) -> None:
        """Schema includes envelope-level fields."""
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        properties = schema.get("properties", {})
        assert "messageId" in properties
        assert "messageType" in properties
        assert "schemaVersion" in properties
        assert "occurredAt" in properties
        assert "producer" in properties
        assert "payload" in properties

    def test_schema_includes_payload_fields(self) -> None:
        """Schema includes payload-level fields."""
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        payload_ref = schema.get("properties", {}).get("payload", {})
        assert "$ref" in payload_ref or "anyOf" in payload_ref

    def test_v2_requires_owner_user_id(self) -> None:
        schema = generate_json_schema(VK_EXECUTION_REQUESTED_V2)
        payload_ref = schema["properties"]["payload"]["$ref"]
        definition = payload_ref.rsplit("/", 1)[-1]
        payload_schema = schema["$defs"][definition]
        assert "ownerUserId" in payload_schema["required"]

    def test_valid_fixture_passes_schema(self) -> None:
        """A valid fixture passes schema validation."""
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        fixture_path = (
            Path(__file__).resolve().parent.parent
            / "examples"
            / "vk.execution.requested"
            / "v1"
            / "valid-single-demand.json"
        )
        with open(fixture_path) as fixture:
            instance = json.load(fixture)
        jsonschema.validate(instance, schema)

    def test_schema_is_deterministic(self) -> None:
        """Same contract produces identical schema on repeated calls."""
        schema1 = generate_json_schema(VK_EXECUTION_REQUESTED)
        schema2 = generate_json_schema(VK_EXECUTION_REQUESTED)
        assert schema1 == schema2

    def test_correlation_required_is_non_nullable(self) -> None:
        """correlation_required adds correlationId as non-nullable string."""
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        assert "correlationId" in schema.get("required", [])
        correlation = schema.get("properties", {}).get("correlationId", {})
        assert correlation == {"type": "string", "format": "uuid"}, (
            f"Expected non-nullable uuid, got {correlation}"
        )

    def test_causation_forbidden_is_null(self) -> None:
        """causation_policy=forbidden sets causationId to type null."""
        schema = generate_json_schema(VK_EXECUTION_REQUESTED)
        causation = schema.get("properties", {}).get("causationId", {})
        assert causation == {"type": "null"}


class TestManifestGeneration:
    def test_manifest_includes_both_vk_contract_versions(self) -> None:
        manifest = generate_manifest(VK_CATALOG)
        contracts = manifest["contracts"]
        assert len(contracts) == 2
        assert [entry["schemaVersion"] for entry in contracts] == [1, 2]
        assert all(
            entry["messageType"] == "vk.execution.requested"
            for entry in contracts
        )
        assert all(
            entry["topic"] == "parsevk.vk.commands"
            for entry in contracts
        )

    def test_manifest_producers_consumers(self) -> None:
        """Manifest includes correct producers and consumers."""
        manifest = generate_manifest(VK_CATALOG)
        for entry in manifest["contracts"]:
            assert "tasks-service" in entry["producers"]
            assert "vk-service" in entry["consumers"]

    def test_manifest_partition_key(self) -> None:
        """Manifest includes partition key spec."""
        manifest = generate_manifest(VK_CATALOG)
        for entry in manifest["contracts"]:
            assert "partitionKey" in entry
            assert entry["partitionKey"]["paths"] == [
                "payload.executionId"
            ]
            assert entry["partitionKey"]["separator"] == ":"

    def test_manifest_correlation_path(self) -> None:
        """Manifest includes correlationPath."""
        manifest = generate_manifest(VK_CATALOG)
        for entry in manifest["contracts"]:
            assert entry.get("correlationPath") == "payload.executionId"

    def test_manifest_is_deterministic(self) -> None:
        """Same catalog produces identical manifest."""
        manifest1 = generate_manifest(VK_CATALOG)
        manifest2 = generate_manifest(VK_CATALOG)
        assert manifest1 == manifest2

    def test_manifest_multiple_contracts(self) -> None:
        """Manifest includes all contracts when catalog has multiple."""

        class ExtraPayload(ContractModel):
            id: str

        extra = MessageContract(
            message_type="extra.event",
            schema_version=1,
            payload_model=ExtraPayload,
            topic="extra.topic",
            producers=frozenset({"svc"}),
            consumers=frozenset({"svc"}),
        )
        combined = ContractCatalog.from_contracts(
            VK_CATALOG.contracts + (extra,)
        )
        manifest = generate_manifest(combined)
        assert len(manifest["contracts"]) == 3


class TestGenerateAll:
    def test_generate_all_creates_files(self, tmp_path: Path) -> None:
        """generate_all creates JSON Schema and manifest files."""
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
        """Generated schema files are valid Draft 2020-12."""
        result = generate_all(VK_CATALOG, output_dir=str(tmp_path))
        for schema_name in result["json_schema"]:
            with open(schema_name) as schema_file:
                schema = json.load(schema_file)
            jsonschema.Draft202012Validator.check_schema(schema)
