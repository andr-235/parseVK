from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.model_utils import utcnow

if TYPE_CHECKING:
    from app.db.dl_match_models import DlMatchResult


class DlImportBatch(Base):
    __tablename__ = "dl_import_batch"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    files_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    files_success: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    files_failed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )

    files: Mapped[list[DlImportFile]] = relationship(
        back_populates="batch", cascade="all, delete-orphan"
    )


class DlImportFile(Base):
    __tablename__ = "dl_import_file"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    batch_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("dl_import_batch.id", ondelete="CASCADE"),
        nullable=False,
    )
    original_file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    rows_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rows_success: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rows_failed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    replaced_file_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("dl_import_file.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )

    batch: Mapped[DlImportBatch] = relationship(back_populates="files")
    contacts: Mapped[list[DlContact]] = relationship(
        back_populates="import_file", cascade="all, delete-orphan"
    )
    replaced_file: Mapped[DlImportFile | None] = relationship(
        "DlImportFile", remote_side=[id], backref="replacements"
    )


class DlContact(Base):
    __tablename__ = "dl_contact"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    import_file_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("dl_import_file.id", ondelete="CASCADE"),
        nullable=False,
    )
    telegram_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    username: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    first_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    region: Mapped[str | None] = mapped_column(Text, nullable=True)
    joined_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    channels_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    full_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    vk_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)
    telegram_contact: Mapped[str | None] = mapped_column(Text, nullable=True)
    instagram: Mapped[str | None] = mapped_column(Text, nullable=True)
    viber: Mapped[str | None] = mapped_column(Text, nullable=True)
    odnoklassniki: Mapped[str | None] = mapped_column(Text, nullable=True)
    birth_date_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    username_extra: Mapped[str | None] = mapped_column(Text, nullable=True)
    geo: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_row_index: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )

    import_file: Mapped[DlImportFile] = relationship(back_populates="contacts")
    match_results: Mapped[list[DlMatchResult]] = relationship(
        "DlMatchResult", back_populates="contact", cascade="all, delete-orphan"
    )
