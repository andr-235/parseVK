from datetime import UTC, datetime
from uuid import UUID as PyUUID
from uuid import uuid4

from app.db.base import Base
from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(UTC)


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
