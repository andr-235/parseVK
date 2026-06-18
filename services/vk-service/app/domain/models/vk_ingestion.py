from datetime import UTC, datetime
from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
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
