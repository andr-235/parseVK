from pathlib import Path


def test_only_canonical_vk_runtime_is_wired():
    app_root = Path(__file__).resolve().parents[1] / "app"
    tasks_root = app_root / "tasks"
    lifespan = (tasks_root / "lifespan.py").read_text(encoding="utf-8")
    workers = (tasks_root / "lifespan_workers.py").read_text(encoding="utf-8")
    runtime = lifespan + workers
    bootstrap = (app_root / "bootstrap.py").read_text(encoding="utf-8")

    assert "VkExecutionCommandsConsumer" in runtime
    assert "TaskEventsConsumer" not in runtime
    assert "get_task_events_handler" not in bootstrap
