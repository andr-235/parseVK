from pathlib import Path


def test_legacy_task_event_runtime_is_removed():
    root = Path(__file__).parents[1]
    assert not (root / "app/tasks/kafka_consumer.py").exists()
    assert not (root / "app/services/task_events_service.py").exists()


def test_canonical_consumer_does_not_build_synthetic_task_event():
    root = Path(__file__).parents[1]
    content = (root / "app/tasks/vk_commands_consumer.py").read_text()
    assert "TaskEvent" not in content
    assert '"task.created"' not in content
