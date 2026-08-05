"""Tests for AsyncAPI 3.1 generation."""

from __future__ import annotations

from pathlib import Path

import yaml

from parsevk_contracts.generation.asyncapi import generate_asyncapi, write_asyncapi
from parsevk_contracts.vk.commands import CATALOG as VK_CATALOG


class TestAsyncApiGeneration:
    def test_generates_valid_structure(self) -> None:
        doc = generate_asyncapi(VK_CATALOG)
        assert doc["asyncapi"] == "3.1.0"
        assert doc["info"]["title"] == "ParseVK Contracts"
        assert "channels" in doc
        assert "components" in doc

    def test_contains_canonical_commands(self) -> None:
        messages = generate_asyncapi(VK_CATALOG)["components"]["messages"]
        assert set(messages) == {
            "vk_execution_requested",
            "vk_execution_cancel_requested",
        }
        assert messages["vk_execution_requested"]["name"] == "vk.execution.requested"

    def test_channel_for_canonical_topic(self) -> None:
        channels = generate_asyncapi(VK_CATALOG)["channels"]
        channel = channels["parsevk_vk_commands"]
        assert channel["address"] == "parsevk.vk.commands"
        assert set(channel["messages"]) == {
            "vk_execution_requested",
            "vk_execution_cancel_requested",
        }
        assert channel["messages"]["vk_execution_requested"]["$ref"] == (
            "#/components/messages/vk_execution_requested"
        )

    def test_payload_refers_to_flat_json_schema(self) -> None:
        document = generate_asyncapi(VK_CATALOG)
        message = document["components"]["messages"]["vk_execution_requested"]
        assert message["payload"]["$ref"].endswith("vk.execution.requested.json")

    def test_is_deterministic(self) -> None:
        assert generate_asyncapi(VK_CATALOG) == generate_asyncapi(VK_CATALOG)

    def test_has_unversioned_operations(self) -> None:
        operations = generate_asyncapi(VK_CATALOG)["operations"]
        assert operations["tasks_service_send_vk_execution_requested"]["action"] == "send"
        assert operations["vk_service_receive_vk_execution_requested"]["action"] == (
            "receive"
        )
        assert "tasks_service_send_vk_execution_requested_v1" not in operations

    def test_operation_messages_ref_channels(self) -> None:
        document = generate_asyncapi(VK_CATALOG)
        for operation_name, operation in document.get("operations", {}).items():
            assert "messages" in operation, f"Operation {operation_name} has no messages"
            for message in operation["messages"]:
                assert message["$ref"].startswith("#/channels/")

    def test_channel_messages_ref_components(self) -> None:
        document = generate_asyncapi(VK_CATALOG)
        for channel in document.get("channels", {}).values():
            for message in channel.get("messages", {}).values():
                assert message["$ref"].startswith("#/components/messages/")

    def test_writes_valid_yaml(self, tmp_path: Path) -> None:
        path = write_asyncapi(VK_CATALOG, tmp_path)
        parsed = yaml.safe_load(path.read_text(encoding="utf-8"))
        assert parsed["asyncapi"] == "3.1.0"

    def test_generate_all_includes_asyncapi(self, tmp_path: Path) -> None:
        from parsevk_contracts.generation import generate_all

        result = generate_all(VK_CATALOG, output_dir=str(tmp_path))
        assert len(result["asyncapi"]) == 1
        assert Path(result["asyncapi"][0]).exists()
