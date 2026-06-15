from datetime import datetime, timezone
from uuid import UUID as PyUUID

from sqlalchemy import BigInteger, Boolean, DateTime, Index, String, Text, UniqueConstraint, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ModerationComment(Base):
    __tablename__ = "moderation_comments"
    __table_args__ = (
        Index("ix_moderation_comments_date_id", "date", "id"),
        Index("ix_moderation_comments_is_read", "is_read"),
        Index("ix_moderation_comments_watchlist_author_id", "watchlist_author_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    external_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    post_external_key: Mapped[str] = mapped_column(Text, nullable=False)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    author_vk_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="TASK")
    matched_keywords: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default="[]")
    watchlist_author_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("watchlist_authors.id", ondelete="SET NULL"), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    watchlist_author = relationship("WatchlistAuthor", back_populates="comments")


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


from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship


class Keyword(Base):
    __tablename__ = "keywords"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    word: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    category: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_phrase: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    keyword_forms = relationship(
        "KeywordForm",
        back_populates="keyword",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    keyword_form_exclusions = relationship(
        "KeywordFormExclusion",
        back_populates="keyword",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class KeywordForm(Base):
    __tablename__ = "keyword_forms"
    __table_args__ = (
        UniqueConstraint("keyword_id", "form", "source", name="uq_keyword_forms_keyword_form_source"),
        Index("ix_keyword_forms_keyword_id", "keyword_id"),
        Index("ix_keyword_forms_form", "form"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    keyword_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("keywords.id", ondelete="CASCADE"), nullable=False)
    form: Mapped[str] = mapped_column(String(255), nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False)  # "generated" | "manual"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    keyword = relationship("Keyword", back_populates="keyword_forms")


class KeywordFormExclusion(Base):
    __tablename__ = "keyword_form_exclusions"
    __table_args__ = (
        UniqueConstraint("keyword_id", "form", name="uq_keyword_form_exclusions_keyword_form"),
        Index("ix_keyword_form_exclusions_keyword_id", "keyword_id"),
        Index("ix_keyword_form_exclusions_form", "form"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    keyword_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("keywords.id", ondelete="CASCADE"), nullable=False)
    form: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    keyword = relationship("Keyword", back_populates="keyword_form_exclusions")


class KeywordRecalculationJob(Base):
    __tablename__ = "keyword_recalculation_jobs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")  # "pending" | "running" | "succeeded" | "failed"
    single_keyword_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    processed: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    updated: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    created: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    deleted: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    requested_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class WatchlistSettings(Base):
    __tablename__ = "watchlist_settings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    track_all_comments: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    poll_interval_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    max_authors: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    authors = relationship("WatchlistAuthor", back_populates="settings", cascade="all, delete-orphan")


class WatchlistAuthor(Base):
    __tablename__ = "watchlist_authors"
    __table_args__ = (
        UniqueConstraint("author_vk_id", "settings_id", name="uq_watchlist_authors_author_settings"),
        Index("ix_watchlist_authors_status", "status"),
        Index("ix_watchlist_authors_settings_id", "settings_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    author_vk_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    source_comment_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_activity_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    found_comments_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    monitoring_started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    monitoring_stopped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    settings_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("watchlist_settings.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    settings = relationship("WatchlistSettings", back_populates="authors")
    comments = relationship("ModerationComment", back_populates="watchlist_author")


class PhotoAnalysis(Base):
    __tablename__ = "photo_analyses"
    __table_args__ = (
        UniqueConstraint("author_vk_id", "photo_vk_id", name="uq_photo_analyses_author_photo"),
        Index("ix_photo_analyses_author_vk_id", "author_vk_id"),
        Index("ix_photo_analyses_suspicion_level", "suspicion_level"),
        Index("ix_photo_analyses_analyzed_at", "analyzed_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    author_vk_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    photo_url: Mapped[str] = mapped_column(Text, nullable=False)
    photo_vk_id: Mapped[str] = mapped_column(String(255), nullable=False)
    analysis_result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    has_suspicious: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    suspicion_level: Mapped[str] = mapped_column(String(32), nullable=False, default="NONE")
    categories: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default="[]")
    confidence: Mapped[float | None] = mapped_column(nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    analyzed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)


