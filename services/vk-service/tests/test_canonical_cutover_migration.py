from pathlib import Path


def test_cutover_migration_removes_legacy_aggregate_runtime():
    alembic_dir = Path(__file__).resolve().parents[1] / "alembic"
    wrapper = (
        alembic_dir / "versions" / "pr6b_source_level_collection_identity.py"
    ).read_text(encoding="utf-8")
    migration = (alembic_dir / "source_level_collection_identity.py").read_text(
        encoding="utf-8"
    )

    assert "source_level_collection_identity.py" in wrapper
    assert "DELETE FROM vk_collection_demands" in migration
    assert "DELETE FROM vk_source_collections" in migration
    assert "legacy aggregate execution invalidated" in migration
    assert "vk_task_run_bindings" in migration
    assert "identity_version" not in migration
