from pathlib import Path


def test_command_consumer_does_not_translate_to_task_event():
    root = Path(__file__).parents[1]
    content = (root / "app/tasks/vk_commands_consumer.py").read_text()

    assert "TaskEvent" not in content
    assert "get_task_events_handler" not in content
    assert "task.created" not in content
