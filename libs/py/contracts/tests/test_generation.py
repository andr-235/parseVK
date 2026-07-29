"""Tests for JSON Schema and manifest generation."""

from __future__ import annotations

import json
from pathlib import Path

import jsonschema
import pytest

from parsevk_contracts._base import ContractModel
from parsevk_contracts.catalog import ContractCatalog, MessageContract, PartitionKeySpec
from parsevk_contracts.generation import generate_all
from parsevk_contracts.generation.json_schema import generate_json_schema
from parsevk_contracts.generation.manifest import generate_manifest
from parsevk_contracts.vk.commands import CATALOG as VK_CATALOG
from parsevk_contracts.vk.commands import VK_EXECUTION_REQUESTED


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
        with open(fixture_path) as f:
            instance = json.load(f)
        jsonschema.validate(instance, schema)

    def test_schema_is_deterministic(self) -> None:
        """Same contract produces identical schema on repeated calls."""
        schema1 = generate_json_schema(VK_EXECUTION_REQUESTED)
        schema2 = generate_json_schema(VK_EXECUTION_REQUESTED)
        assert schema1 == schema2


class TestManifestGeneration:
    def test_manifest_includes_pilot_contract(self) -> None:
        """Manifest includes the pilot contract entry."""
        manifest = generate_manifest()
        contracts = manifest["contracts"]
        assert len(contracts) == 1
        entry = contracts[0]
        assert entry["message_type"] == "vk.execution.requested"
        assert entry["schema_version"] == 1
        assert entry["topic"] == "parsevk.vk.commands"

    def test_manifest_producers_consumers(self) -> None:
        """Manifest includes correct producers and consumers."""
        manifest = generate_manifest()
        entry = manifest["contracts"][0]
        assert "tasks-service" in entry["producers"]
        assert "vk-service" in entry["consumers"]

    def test_manifest_partition_key(self) -> None:
        """Manifest includes partition key spec."""
        manifest = generate_manifest()
        entry = manifest["contracts"][0]
        assert "partition_key" in entry
        assert entry["partition_key"] == ["payload.executionId"]

    def test_manifest_is_deterministic(self) -> None:
        """Same catalog produces identical manifest."""
        manifest1 = generate_manifest()
        manifest2 = generate_manifest()
        # Compare without generated_at which differs every call
        m1 = {k: v for k, v in manifest1.items() if k != "generated_at"}
        m2 = {k: v for k, v in manifest2.items() if k != "generated_at"}
        assert m1 == m2

    def test_manifest_multiple_contracts(self) -> None:
        """Manifest includes all contracts when catalog has multiple."""
        payload_model: type[ContractModel]
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
        original = VK_CATALOG._contracts
        VK_CATALOG._contracts = original + (extra,)
        try:
            manifest = generate_manifest()
            assert len(manifest["contracts"]) >= 2
        finally:
            VK_CATALOG._contracts = original


class TestGenerateAll:
    def test_generate_all_creates_files(self, tmp_path: Path) -> None:
        """generate_all creates JSON Schema and manifest files."""
        result = generate_all(VK_CATALOG, output_dir=str(tmp_path))
        assert len(result["json_schema"]) == 1
        assert len(result["manifest"]) == 1

        # Verify files exist
        schema_path = Path(result["json_schema"][0])
        manifest_path = Path(result["manifest"][0])
        assert schema_path.exists()
        assert manifest_path.exists()

        # Verify they contain valid JSON
        with open(schema_path) as f:
            schema = json.load(f)
        assert "$schema" in schema

        with open(manifest_path) as f:
            manifest = json.load(f)
        assert "contracts" in manifest

    def test_generated_schema_is_valid(self, tmp_path: Path) -> None:
        """Generated schema file is valid Draft 2020-12."""
        result = generate_all(VK_CATALOG, output_dir=str(tmp_path))
        schema_path = Path(result["json_schema"][0])
        with open(schema_path) as f:
            schema = json.load(f)
        jsonschema.Draft202012Validator.check_schema(schema)
