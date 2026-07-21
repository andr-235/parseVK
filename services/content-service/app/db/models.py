from datetime import UTC, datetime
from uuid import UUID as PyUUID

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSON, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class ContentGroup(Base):
    __tablename__ = "content_groups"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    vk_group_id: Mapped[int] = mapped_column(BigInteger, nullable=False, unique=True)
    screen_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    name: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_closed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    deactivated: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    photo_50: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_100: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_200: Mapped[str | None] = mapped_column(Text, nullable=True)
    activity: Mapped[str | None] = mapped_column(Text, nullable=True)
    age_limits: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    members_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified: Mapped[int | None] = mapped_column(Integer, nullable=True)
    wall: Mapped[int | None] = mapped_column(Integer, nullable=True)
    addresses: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    city: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    counters: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    last_collected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class ContentAuthor(Base):
    __tablename__ = "content_authors"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    vk_author_id: Mapped[int] = mapped_column(BigInteger, nullable=False, unique=True)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    display_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    first_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_50: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_100: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_200: Mapped[str | None] = mapped_column(Text, nullable=True)
    domain: Mapped[str | None] = mapped_column(Text, nullable=True)
    screen_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    country: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    followers_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column("verifiedAt", DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
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
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_retry_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ImMessage(Base):
    __tablename__ = "im_messages"
    __table_args__ = (
        Index("ix_im_messages_messenger_created", "messenger", "created_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    messenger: Mapped[str] = mapped_column(String(32), nullable=False)
    external_id: Mapped[str] = mapped_column(String(256), nullable=False)
    chat_external_id: Mapped[str] = mapped_column(String(256), nullable=False)
    chat_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    author: Mapped[str | None] = mapped_column(Text, nullable=True)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    metadata_raw: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)



