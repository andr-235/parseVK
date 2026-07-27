from datetime import UTC, datetime
from uuid import UUID as PyUUID

from sqlalchemy import (
    BigInteger,
    DateTime,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class RealtimeEvent(Base):
    __tablename__ = "realtime_events"
    __table_args__ = (
        Index("ix_realtime_events_audience_seq", "audience_type", "audience_id", "sequence_id"),
        Index("ix_realtime_events_expires", "expires_at"),
    )

    sequence_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    event_id: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True)
    event_type: Mapped[str] = mapped_column(String(128), nullable=False)
    event_version: Mapped[int] = mapped_column(Integer, nullable=False)
    source_topic: Mapped[str] = mapped_column(Text, nullable=False)
    source_partition: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_offset: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    audience_type: Mapped[str] = mapped_column(String(32), nullable=False)
    audience_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    aggregate_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    aggregate_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
