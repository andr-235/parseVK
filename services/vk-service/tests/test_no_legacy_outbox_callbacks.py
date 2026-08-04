from pathlib import Path


def test_tasks_runtime_does_not_publish_legacy_execution_requests():
    root = Path(__file__).parents[2] / "tasks-service"
    paths = [
        root / "app/modules/tasks/crud_service.py",
        root / "app/modules/tasks/state_service.py",
        root / "app/modules/automation/service.py",
    ]
    content = "\n".join(path.read_text() for path in paths)

    assert 'event_type="task.created"' not in content
    assert 'event_type="task.resumed"' not in content
    assert 'event_type="task.automation_run_requested"' not in content
