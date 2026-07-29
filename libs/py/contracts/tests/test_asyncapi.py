"""Tests for AsyncAPI 3.1 generation."""

from __future__ import annotations

from pathlib import Path

import yaml
from parsevk_contracts.generation.asyncapi import generate_asyncapi, write_asyncapi
from parsevk_contracts.vk.commands import CATALOG as VK_CATALOG


class TestAsyncApiGeneration:
    def test_generates_valid_structure(self) -> None:
        """Generated AsyncAPI document has correct top-level structure."""
        doc = generate_asyncapi(VK_CATALOG)
        assert doc["asyncapi"] == "3.1.0"
        assert doc["info"]["title"] == "ParseVK Contracts"
        assert "channels" in doc
        assert "components" in doc

    def test_contains_pilot_contract(self) -> None:
        """AsyncAPI includes the pilot contract."""
        doc = generate_asyncapi(VK_CATALOG)
        messages = doc["components"]["messages"]
        assert "vk_execution_requested" in messages
        msg = messages["vk_execution_requested"]
        assert msg["name"] == "vk.execution.requested"

    def test_channel_for_pilot_topic(self) -> None:
        """AsyncAPI includes channel for parsevk.vk.commands."""
        doc = generate_asyncapi(VK_CATALOG)
        channels = doc["channels"]
        channel_key = "parsevk_vk_commands"
        assert channel_key in channels
        assert channels[channel_key]["address"] == "parsevk.vk.commands"

    def test_channel_references_message(self) -> None:
        """Channel references the correct message."""
        doc = generate_asyncapi(VK_CATALOG)
        channel = doc["channels"]["parsevk_vk_commands"]
        assert "vk_execution_requested" in channel["messages"]
        ref = channel["messages"]["vk_execution_requested"]["$ref"]
        assert ref == "#/components/messages/vk_execution_requested"

    def test_payload_refers_to_json_schema(self) -> None:
        """Message payload references the generated JSON Schema file."""
        doc = generate_asyncapi(VK_CATALOG)
        msg = doc["components"]["messages"]["vk_execution_requested"]
        payload_ref = msg["payload"]["$ref"]
        assert "json-schema/vk.execution.requested/1.json" in payload_ref

    def test_is_deterministic(self) -> None:
        """Same catalog produces identical AsyncAPI document."""
        doc1 = generate_asyncapi(VK_CATALOG)
        doc2 = generate_asyncapi(VK_CATALOG)
        assert doc1 == doc2

    def test_writes_valid_yaml(self, tmp_path: Path) -> None:
        """Written AsyncAPI file is valid YAML."""
        path = write_asyncapi(VK_CATALOG, tmp_path)
        assert path.exists()
        with open(path) as f:
            content = f.read()
        parsed = yaml.safe_load(content)
        assert parsed["asyncapi"] == "3.1.0"

    def test_generate_all_includes_asyncapi(self, tmp_path: Path) -> None:
        """generate_all creates AsyncAPI file."""
        from parsevk_contracts.generation import generate_all
        result = generate_all(VK_CATALOG, output_dir=str(tmp_path))
        assert len(result["asyncapi"]) == 1
        asyncapi_path = Path(result["asyncapi"][0])
        assert asyncapi_path.exists()
