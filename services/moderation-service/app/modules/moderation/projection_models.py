from datetime import UTC, datetime

from sqlalchemy import BigInteger, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CanonicalCommentRevision(Base):
    __tablename__ = "moderation_canonical_comment_revisions"

    external_key: Mapped[str] = mapped_column(Text, primary_key=True)
    post_revision: Mapped[int] = mapped_column(BigInteger, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )
