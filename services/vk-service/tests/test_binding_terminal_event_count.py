from pathlib import Path


def test_terminal_dedupe_keys_are_binding_scoped():
    root = Path(__file__).parents[1]
    content = (
        root / "app/infrastructure/db/repositories/executions.py"
    ).read_text()

    assert 'f"task.execution_completed:{binding.id}"' in content
    assert 'f"task.execution_failed:{binding.id}"' in content
    assert 'f"task.execution_completed:{demand.id}"' not in content
    assert 'f"task.execution_failed:{demand.id}"' not in content
