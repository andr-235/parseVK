from pathlib import Path


def test_legacy_task_execution_runtime_is_removed():
    service_root = Path(__file__).resolve().parents[1] / "app"

    assert not (service_root / "services" / "task_events_service.py").exists()
    assert not (service_root / "tasks" / "kafka_consumer.py").exists()

    consumer = (service_root / "tasks" / "vk_commands_consumer.py").read_text(
        encoding="utf-8"
    )
    assert "from app.services.task_events_service" not in consumer
    assert "from app.tasks.kafka_consumer" not in consumer
    assert '"task.created"' not in consumer
    assert "'task.created'" not in consumer
    assert "vk.execution.requested" in consumer
    assert "vk.execution.cancel_requested" in consumer
