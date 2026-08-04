from pathlib import Path


def test_execution_claim_requires_canonical_collection_and_demand():
    root = Path(__file__).parents[1]
    content = (
        root / "app/infrastructure/db/repositories/executions.py"
    ).read_text()

    assert "compatible_collection" in content
    assert "active_demand" in content
    assert "~collection_exists" not in content
