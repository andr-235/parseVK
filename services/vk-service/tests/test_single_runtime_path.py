from pathlib import Path


def test_only_canonical_vk_runtime_is_wired():
    app_root = Path(__file__).resolve().parents[1] / "app"
    lifespan = (app_root / "tasks" / "lifespan.py").read_text(encoding="utf-8")
    bootstrap = (app_root / "bootstrap.py").read_text(encoding="utf-8")

    assert "VkExecutionCommandsConsumer" in lifespan
    assert "TaskEventsConsumer" not in lifespan
    assert "get_task_events_handler" not in bootstrap
