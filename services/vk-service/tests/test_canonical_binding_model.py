from app.infrastructure.db.models.source_collections import VkTaskRunBinding


def test_task_run_binding_owns_aggregate_lifecycle_fields():
    columns = VkTaskRunBinding.__table__.columns

    assert "expected_demands" in columns
    assert "completed_demands" in columns
    assert "failed_demands" in columns
    assert "cancelled_demands" in columns
    assert "processed_items" in columns
    assert "total_items" in columns
    assert "execution_sequence" in columns
