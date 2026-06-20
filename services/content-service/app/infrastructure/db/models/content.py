from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base
from app.infrastructure.db.models.common import utcnow


class ContentGroup(Base):
    __tablename__ = "content_groups"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    vk_group_id: Mapped[int] = mapped_column(BigInteger, nullable=False, unique=True)
    screen_name: Mapped[str | None] = mapped_column(Text)
    name: Mapped[str | None] = mapped_column(Text)
    is_closed: Mapped[bool | None] = mapped_column(Boolean)
    deactivated: Mapped[str | None] = mapped_column(Text)
    type: Mapped[str | None] = mapped_column(String(32))
    photo_50: Mapped[str | None] = mapped_column(Text)
    photo_100: Mapped[str | None] = mapped_column(Text)
    photo_200: Mapped[str | None] = mapped_column(Text)
    activity: Mapped[str | None] = mapped_column(Text)
    age_limits: Mapped[int | None] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(Text)
    members_count: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str | None] = mapped_column(Text)
    verified: Mapped[int | None] = mapped_column(Integer)
    wall: Mapped[int | None] = mapped_column(Integer)
    addresses: Mapped[dict | None] = mapped_column(JSON)
    city: Mapped[dict | None] = mapped_column(JSON)
    counters: Mapped[dict | None] = mapped_column(JSON)
    last_collected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )


class ContentAuthor(Base):
    __tablename__ = "content_authors"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    vk_author_id: Mapped[int] = mapped_column(BigInteger, nullable=False, unique=True)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    display_name: Mapped[str | None] = mapped_column(Text)
    first_name: Mapped[str | None] = mapped_column(Text)
    last_name: Mapped[str | None] = mapped_column(Text)
    photo_50: Mapped[str | None] = mapped_column(Text)
    photo_100: Mapped[str | None] = mapped_column(Text)
    photo_200: Mapped[str | None] = mapped_column(Text)
    domain: Mapped[str | None] = mapped_column(Text)
    screen_name: Mapped[str | None] = mapped_column(Text)
    city: Mapped[dict | None] = mapped_column(JSON)
    country: Mapped[dict | None] = mapped_column(JSON)
    followers_count: Mapped[int | None] = mapped_column(Integer)
    verified_at: Mapped[datetime | None] = mapped_column(
        "verifiedAt", DateTime(timezone=True)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )


class ContentPost(Base):
    __tablename__ = "content_posts"
    __table_args__ = (Index("ix_content_posts_date_id", "date", "id"),)
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    external_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    vk_owner_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    vk_post_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    vk_group_id: Mapped[int | None] = mapped_column(BigInteger)
    author_vk_id: Mapped[int | None] = mapped_column(BigInteger)
    date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    text: Mapped[str | None] = mapped_column(Text)
    comments_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_collected_task_id: Mapped[int | None] = mapped_column(BigInteger)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )


class ContentComment(Base):
    __tablename__ = "content_comments"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    external_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    post_external_key: Mapped[str] = mapped_column(Text, nullable=False)
    vk_owner_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    vk_post_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    vk_comment_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    author_vk_id: Mapped[int | None] = mapped_column(BigInteger)
    date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    text: Mapped[str | None] = mapped_column(Text)
    last_collected_task_id: Mapped[int | None] = mapped_column(BigInteger)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
