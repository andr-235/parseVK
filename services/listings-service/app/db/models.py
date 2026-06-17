from datetime import UTC, datetime

from app.db.base import Base
from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    DateTime,
    Float,
    Index,
    Integer,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(UTC)


class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = (
        Index("ix_listings_city", "city"),
        Index("ix_listings_price", "price"),
        Index("ix_listings_archived", "archived"),
        Index("ix_listings_contact_phone", "contact_phone"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    source: Mapped[str | None] = mapped_column(Text, nullable=True)
    external_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    currency: Mapped[str | None] = mapped_column(Text, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    rooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    area_total: Mapped[float | None] = mapped_column(Float, nullable=True)
    area_living: Mapped[float | None] = mapped_column(Float, nullable=True)
    area_kitchen: Mapped[float | None] = mapped_column(Float, nullable=True)
    floor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    floors_total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    contact_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    images: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    source_author_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_author_phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_author_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_posted_at: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_parsed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    manual_overrides: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    manual_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
