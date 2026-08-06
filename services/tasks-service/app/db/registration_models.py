from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.model_utils import utcnow


class SourceRegistration(Base):
    """Durable per-user registration of one globally deduplicated source."""

    __tablename__ = "source_registrations"
    __table_args__ = (Index("ix_source_registrations_source", "source_id"),)

    owner_user_id: Mapped[str] = mapped_column(
        String(128),
        primary_key=True,
    )
    source_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("monitoring_sources.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utcnow,
    )
