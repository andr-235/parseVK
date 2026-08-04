from pathlib import Path


def test_cutover_migration_removes_legacy_aggregate_runtime():
    migration = (
        Path(__file__).resolve().parents[1]
        / "alembic"
        / "versions"
        / "pr6b_source_level_collection_identity.py"
    ).read_text(encoding="utf-8")

    assert "DELETE FROM vk_collection_demands" in migration
    assert "DELETE FROM vk_source_collections" in migration
    assert "legacy aggregate execution invalidated" in migration
    assert "vk_task_run_bindings" in migration
    assert "identity_version" not in migration
