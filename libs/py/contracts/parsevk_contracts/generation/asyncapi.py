"""AsyncAPI 3.1 generation for semantic message contracts."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from parsevk_contracts._metadata import PACKAGE_VERSION
from parsevk_contracts.catalog import ContractCatalog, MessageContract


def _message_name(contract: MessageContract) -> str:
    return contract.message_type.replace(".", "_")


def generate_asyncapi(catalog: ContractCatalog) -> dict[str, object]:
    channels: dict[str, dict[str, Any]] = {}
    messages: dict[str, dict[str, Any]] = {}
    operations: dict[str, dict[str, Any]] = {}
    for contract in sorted(catalog.contracts, key=lambda item: item.message_type):
        message_name = _message_name(contract)
        messages[message_name] = {
            "name": contract.message_type,
            "title": contract.message_type,
            "summary": contract.message_type,
            "contentType": "application/json",
            "payload": {
                "$ref": f"../json-schema/{contract.message_type}.json",
            },
        }
        channel_name = contract.topic.replace(".", "_")
        channel = channels.setdefault(
            channel_name,
            {"address": contract.topic, "messages": {}},
        )
        channel["messages"][message_name] = {
            "$ref": f"#/components/messages/{message_name}",
        }
        message_ref = f"#/channels/{channel_name}/messages/{message_name}"
        for producer in sorted(contract.producers):
            operation = f"{producer.replace('-', '_')}_send_{message_name}"
            operations[operation] = {
                "action": "send",
                "channel": {"$ref": f"#/channels/{channel_name}"},
                "messages": [{"$ref": message_ref}],
            }
        for consumer in sorted(contract.consumers):
            operation = f"{consumer.replace('-', '_')}_receive_{message_name}"
            operations[operation] = {
                "action": "receive",
                "channel": {"$ref": f"#/channels/{channel_name}"},
                "messages": [{"$ref": message_ref}],
            }
    return {
        "asyncapi": "3.1.0",
        "info": {
            "title": "ParseVK Contracts",
            "version": PACKAGE_VERSION,
            "description": "ParseVK Kafka message contracts",
        },
        "defaultContentType": "application/json",
        "channels": channels,
        "operations": operations,
        "components": {"messages": messages},
    }


def write_asyncapi(catalog: ContractCatalog, output_dir: Path) -> Path:
    asyncapi_dir = output_dir / "asyncapi"
    asyncapi_dir.mkdir(parents=True, exist_ok=True)
    path = asyncapi_dir / "parsevk-contracts.yaml"
    try:
        import yaml
    except ImportError as exc:
        raise RuntimeError(
            "AsyncAPI generation requires parsevk-contracts[generation]"
        ) from exc
    text = yaml.safe_dump(
        generate_asyncapi(catalog),
        default_flow_style=False,
        sort_keys=False,
        allow_unicode=True,
    )
    path.write_text(text, encoding="utf-8")
    return path
