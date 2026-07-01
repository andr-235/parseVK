import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.infrastructure.db.models.ok_friends import OkFriendsExportJob, OkFriendsJobLog, OkFriendsRecord
from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.models.tasks import ProcessedEvent, VkTaskRun
from app.infrastructure.db.models.vk_friends import VkFriendsExportJob, VkFriendsJobLog, VkFriendsRecord
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
    assert VkTaskRun.__tablename__ == "vk_task_runs"
    assert ProcessedEvent.__tablename__ == "processed_events"
    assert OutboxEvent.__tablename__ == "outbox_events"
    assert VkFriendsExportJob.__tablename__ == "vk_friends_export_jobs"
    assert VkFriendsJobLog.__tablename__ == "vk_friends_job_logs"
    assert VkFriendsRecord.__tablename__ == "vk_friends_records"


def test_domain_unique_constraints_exist():
    assert VkGroup.__table__.columns["vk_group_id"].unique is True
    assert VkAuthor.__table__.columns["vk_author_id"].unique is True
    assert "uq_vk_posts_owner_post" in constraint_names(VkPost)
    assert "uq_vk_comments_owner_post_comment" in constraint_names(VkComment)
    assert "uq_vk_task_runs_task_id" in constraint_names(VkTaskRun)


def test_event_idempotency_and_outbox_indexes_exist():
    assert "uq_processed_events_consumer_event" in constraint_names(ProcessedEvent)
    assert "ix_processed_events_consumer_event" in index_names(ProcessedEvent)
    assert "ix_outbox_events_status_next_attempt" in index_names(OutboxEvent)
    assert "uq_outbox_events_dedupe_key" in index_names(OutboxEvent)
    assert "ix_vk_friends_job_logs_job_id" in index_names(VkFriendsJobLog)
    assert "ix_vk_friends_records_job_id" in index_names(VkFriendsRecord)
