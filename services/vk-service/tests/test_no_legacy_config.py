from pathlib import Path


def test_vk_runtime_has_no_legacy_path_flags():
    root = Path(__file__).parents[1]
    config = (root / "app/core/config.py").read_text()
    lifespan = (root / "app/tasks/lifespan.py").read_text()

    assert "legacy_task_events_enabled" not in config
    assert "vk_commands_consumer_enabled" not in config
    assert "TaskEventsConsumer" not in lifespan
    assert "TaskCancellationEventsConsumer" not in lifespan
