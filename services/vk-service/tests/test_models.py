import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.infrastructure.db.models.executions import VkExecution, VkExecutionAttempt
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.provider_accounts import VkProviderAccount
from app.infrastructure.db.models.source_collections import (
    VkCollectionDemand,
    VkSourceCollection,
)
from app.infrastructure.db.models.tasks import ProcessedEvent
from app.infrastructure.db.models.vk_friends import (
    VkFriendsExportJob,
    VkFriendsJobLog,
    VkFriendsRecord,
)
from app.infrastructure.db.models.vk_ingestion import VkAuthor, VkComment, VkGroup, VkPost


def constraint_names(model) -> set[str]:
    return {item.name for item in model.__table__.constraints if item.name}


def index_names(model) -> set[str]:
    return {item.name for item in model.__table__.indexes if item.name}


def test_model_tables_exist():
    assert VkGroup.__tablename__ == "vk_groups"
    assert VkAuthor.__tablename__ == "vk_authors"
    assert VkPost.__tablename__ == "vk_posts"
    assert VkComment.__tablename__ == "vk_comments"
    assert VkExecution.__tablename__ == "vk_executions"
    assert VkExecutionAttempt.__tablename__ == "vk_execution_attempts"
    assert VkSourceCollection.__tablename__ == "vk_source_collections"
    assert VkCollectionDemand.__tablename__ == "vk_collection_demands"
    assert ProcessedEvent.__tablename__ == "processed_events"
    assert OutboxEvent.__tablename__ == "outbox_events"
    assert VkFriendsExportJob.__tablename__ == "vk_friends_export_jobs"
    assert VkFriendsJobLog.__tablename__ == "vk_friends_job_logs"
    assert VkFriendsRecord.__tablename__ == "vk_friends_records"
    assert VkProviderAccount.__tablename__ == "vk_provider_accounts"


def test_execution_constraints_exist():
    assert "uq_vk_executions_task_run" in constraint_names(VkExecution)
    assert "ix_vk_executions_claimable" in index_names(VkExecution)
    assert "uq_vk_executions_active_task" not in index_names(VkExecution)
    assert "uq_vk_execution_attempt_number" in constraint_names(VkExecutionAttempt)
    assert "uq_vk_execution_fencing_token" in constraint_names(VkExecutionAttempt)
    assert "uq_vk_execution_attempts_running" in index_names(VkExecutionAttempt)
    assert VkExecution.__table__.columns["plan_snapshot"].nullable is False
    assert VkExecution.__table__.columns["current_fencing_token"].nullable is False


def test_collection_constraints_exist():
    assert "uq_vk_source_collections_execution" in constraint_names(
        VkSourceCollection
    )
    assert "uq_vk_source_collections_active_fingerprint" in index_names(
        VkSourceCollection
    )
    assert "uq_vk_collection_demands_task_run" in constraint_names(
        VkCollectionDemand
    )
    assert "uq_vk_collection_demands_active_task" in index_names(
        VkCollectionDemand
    )
    assert VkSourceCollection.__table__.columns["fingerprint"].nullable is False
    assert VkCollectionDemand.__table__.columns["execution_sequence"].nullable is False


def test_provider_account_model_columns():
    columns = VkProviderAccount.__table__.columns
    assert "uq_vk_provider_accounts_account_key" in constraint_names(VkProviderAccount)
    assert str(columns["id"].type).startswith("UUID")
    assert columns["status"].type.length == 32
    assert columns["credential_version"].type.length == 64
    assert "JSON" in str(columns["capabilities"].type).upper()


def test_domain_and_outbox_indexes_exist():
    assert VkGroup.__table__.columns["vk_group_id"].unique is True
    assert VkAuthor.__table__.columns["vk_author_id"].unique is True
    assert "uq_vk_posts_owner_post" in constraint_names(VkPost)
    assert "uq_vk_comments_owner_post_comment" in constraint_names(VkComment)
    assert "uq_processed_events_consumer_event" in constraint_names(ProcessedEvent)
    assert "ix_processed_events_consumer_event" in index_names(ProcessedEvent)
    assert "ix_outbox_events_status_next_attempt" in index_names(OutboxEvent)
    assert "uq_outbox_events_dedupe_key" in index_names(OutboxEvent)
