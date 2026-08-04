from pathlib import Path


def test_cutover_migration_invalidates_aggregate_runtime():
    migration = (
        Path(__file__).parents[1]
        / "alembic/versions/pr6b_source_level_collection_identity.py"
    ).read_text()

    assert "legacy aggregate execution invalidated" in migration
    assert "DELETE FROM vk_collection_demands" in migration
    assert "DELETE FROM vk_source_collections" in migration
    assert "vk_task_run_bindings" in migration
    assert "uq_vk_executions_task_run" in migration
