from datetime import UTC, datetime
from uuid import UUID as PyUUID
from uuid import uuid4

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class VkGroup(Base):
    __tablename__ = "vk_groups"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    vk_group_id: Mapped[int] = mapped_column(BigInteger, nullable=False, unique=True)
    screen_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    name: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_closed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    raw: Mapped[dict] = mapped_column(JSONB, nullable=False)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)


class VkAuthor(Base):
    __tablename__ = "vk_authors"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    vk_author_id: Mapped[int] = mapped_column(BigInteger, nullable=False, unique=True)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    display_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw: Mapped[dict] = mapped_column(JSONB, nullable=False)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class VkPost(Base):
    __tablename__ = "vk_posts"
    __table_args__ = (
        UniqueConstraint("vk_owner_id", "vk_post_id", name="uq_vk_posts_owner_post"),
        Index("ix_vk_posts_group_date", "vk_group_id", "date"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    vk_post_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    vk_owner_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    vk_group_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    author_vk_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw: Mapped[dict] = mapped_column(JSONB, nullable=False)
    first_task_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    last_task_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class VkComment(Base):
    __tablename__ = "vk_comments"
    __table_args__ = (
        UniqueConstraint("vk_owner_id", "vk_post_id", "vk_comment_id", name="uq_vk_comments_owner_post_comment"),
        Index("ix_vk_comments_owner_post", "vk_owner_id", "vk_post_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    vk_comment_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    vk_owner_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    vk_post_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    author_vk_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw: Mapped[dict] = mapped_column(JSONB, nullable=False)
    first_task_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    last_task_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class VkTaskRun(Base):
    __tablename__ = "vk_task_runs"
    __table_args__ = (
        UniqueConstraint("task_id", name="uq_vk_task_runs_task_id"),
        Index("ix_vk_task_runs_task_id", "task_id"),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    task_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    owner_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    run_id: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    scope: Mapped[str] = mapped_column(String(32), nullable=False)
    mode: Mapped[str] = mapped_column(String(64), nullable=False)
    group_ids: Mapped[list[int]] = mapped_column(ARRAY(BigInteger), nullable=False, default=list)
    post_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    processed_items: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_items: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )


class ProcessedEvent(Base):
    __tablename__ = "processed_events"
    __table_args__ = (
        UniqueConstraint("consumer_name", "event_id", name="uq_processed_events_consumer_event"),
        Index("ix_processed_events_consumer_event", "consumer_name", "event_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    consumer_name: Mapped[str] = mapped_column(Text, nullable=False)
    event_id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    event_type: Mapped[str] = mapped_column(Text, nullable=False)
    processed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class OutboxEvent(Base):
    __tablename__ = "outbox_events"
    __table_args__ = (
        Index("ix_outbox_events_status_next_attempt", "status", "next_attempt_at"),
        Index(
            "uq_outbox_events_dedupe_key",
            "dedupe_key",
            unique=True,
            postgresql_where=text("dedupe_key IS NOT NULL"),
        ),
    )

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    event_type: Mapped[str] = mapped_column(Text, nullable=False)
    event_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    aggregate_type: Mapped[str] = mapped_column(Text, nullable=False)
    aggregate_id: Mapped[str] = mapped_column(Text, nullable=False)
    correlation_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    dedupe_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    next_attempt_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class VkFriendsExportJob(Base):
    __tablename__ = "vk_friends_export_jobs"

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="PENDING")
    params: Mapped[dict] = mapped_column(JSONB, nullable=False)
    vk_user_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    total_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fetched_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    warning: Mapped[str | None] = mapped_column(Text, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    xlsx_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )


class VkFriendsJobLog(Base):
    __tablename__ = "vk_friends_job_logs"
    __table_args__ = (
        Index("ix_vk_friends_job_logs_job_id", "job_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    job_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vk_friends_export_jobs.id", ondelete="CASCADE"), nullable=False
    )
    level: Mapped[str] = mapped_column(String(32), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    meta: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class VkFriendsRecord(Base):
    __tablename__ = "vk_friends_records"
    __table_args__ = (
        Index("ix_vk_friends_records_job_id", "job_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    job_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vk_friends_export_jobs.id", ondelete="CASCADE"), nullable=False
    )
    vk_friend_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class OkFriendsExportJob(Base):
    __tablename__ = "ok_friends_export_jobs"

    id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="PENDING")
    params: Mapped[dict] = mapped_column(JSONB, nullable=False)
    ok_user_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    total_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fetched_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    warning: Mapped[str | None] = mapped_column(Text, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    xlsx_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )


class OkFriendsJobLog(Base):
    __tablename__ = "ok_friends_job_logs"
    __table_args__ = (
        Index("ix_ok_friends_job_logs_job_id", "job_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    job_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ok_friends_export_jobs.id", ondelete="CASCADE"), nullable=False
    )
    level: Mapped[str] = mapped_column(String(32), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    meta: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class OkFriendsRecord(Base):
    __tablename__ = "ok_friends_records"
    __table_args__ = (
        Index("ix_ok_friends_records_job_id", "job_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    job_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ok_friends_export_jobs.id", ondelete="CASCADE"), nullable=False
    )
    ok_friend_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


