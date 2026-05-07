from datetime import datetime, timezone
from uuid import UUID as PyUUID

from sqlalchemy import BigInteger, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ContentGroup(Base):
    __tablename__ = "content_groups"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    vk_group_id: Mapped[int] = mapped_column(BigInteger, nullable=False, unique=True)
    screen_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    name: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_collected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class ContentAuthor(Base):
    __tablename__ = "content_authors"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    vk_author_id: Mapped[int] = mapped_column(BigInteger, nullable=False, unique=True)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    display_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class ContentPost(Base):
    __tablename__ = "content_posts"
    __table_args__ = (Index("ix_content_posts_date_id", "date", "id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    external_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    vk_owner_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    vk_post_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    vk_group_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    author_vk_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    comments_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_collected_task_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class ContentComment(Base):
    __tablename__ = "content_comments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    external_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    post_external_key: Mapped[str] = mapped_column(Text, nullable=False)
    vk_owner_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    vk_post_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    vk_comment_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    author_vk_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_collected_task_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


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
