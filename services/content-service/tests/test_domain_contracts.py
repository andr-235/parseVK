import ast
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.domain.content.errors import InvalidFilterError
from app.domain.events.models import ImEvent, VkEvent


def test_domain_events_validate_supported_payloads():
    vk_event = VkEvent.model_validate(
        {
            "event_id": "64b622d3-d4b0-4a4c-94df-3f9ff5346b34",
            "event_type": "vk.group_deleted",
            "event_version": 1,
            "aggregate_id": "42",
            "correlation_id": "corr-1",
            "payload": {"vkGroupId": 42},
        }
    )
    im_event = ImEvent.model_validate(
        {
            "event_id": "ec7a236f-c1c0-46fc-b095-8c5db2ac7f40",
            "event_type": "im.message_collected",
            "event_version": 1,
            "aggregate_id": "message-1",
            "payload": {
                "messenger": "whatsapp",
                "messageId": "message-1",
                "chatId": "chat-1",
            },
        }
    )

    assert vk_event.payload.vk_group_id == 42
    assert im_event.payload.chat_id == "chat-1"


def test_domain_error_keeps_safe_context():
    error = InvalidFilterError("sort_by", "photosCount")

    assert error.context == {"field": "sort_by", "value": "photosCount"}


def test_domain_and_services_have_no_framework_imports():
    app_root = Path(__file__).resolve().parents[1] / "app"
    forbidden = {"fastapi", "sqlalchemy", "httpx", "aiokafka"}

    for layer in ("domain", "services"):
        for path in (app_root / layer).rglob("*.py"):
            tree = ast.parse(path.read_text(encoding="utf-8"))
            imports = {
                node.names[0].name.split(".")[0]
                for node in ast.walk(tree)
                if isinstance(node, ast.Import)
            }
            imports.update(
                node.module.split(".")[0]
                for node in ast.walk(tree)
                if isinstance(node, ast.ImportFrom) and node.module
            )
            assert imports.isdisjoint(forbidden), (
                f"{path} imports {imports & forbidden}"
            )


def test_production_python_files_respect_size_limit():
    app_root = Path(__file__).resolve().parents[1] / "app"
    excluded = {"config.py"}
    violations = []
    for path in app_root.rglob("*.py"):
        if path.name in excluded:
            continue
        lines = len(path.read_text(encoding="utf-8").splitlines())
        if lines > 150:
            violations.append(f"{path.relative_to(app_root)}:{lines}")
    assert not violations, f"Files exceed 150 lines: {violations}"
