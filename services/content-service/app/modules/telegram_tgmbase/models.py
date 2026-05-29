from datetime import datetime, timezone
from sqlalchemy import BigInteger, Boolean, DateTime, Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

class DlImportBatch(Base):
    __tablename__ = "dl_import_batch"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    files_total: Mapped[int] = mapped_column("files_total", Integer, nullable=False, default=0)
    files_success: Mapped[int] = mapped_column("files_success", Integer, nullable=False, default=0)
    files_failed: Mapped[int] = mapped_column("files_failed", Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column("created_at", DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column("updated_at", DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    files: Mapped[list["DlImportFile"]] = relationship(back_populates="batch", cascade="all, delete-orphan")


class DlImportFile(Base):
    __tablename__ = "dl_import_file"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    batch_id: Mapped[int] = mapped_column("batch_id", BigInteger, ForeignKey("dl_import_batch.id", ondelete="CASCADE"), nullable=False)
    original_file_name: Mapped[str] = mapped_column("original_file_name", String(255), nullable=False)
    file_hash: Mapped[str | None] = mapped_column("file_hash", String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    rows_total: Mapped[int] = mapped_column("rows_total", Integer, nullable=False, default=0)
    rows_success: Mapped[int] = mapped_column("rows_success", Integer, nullable=False, default=0)
    rows_failed: Mapped[int] = mapped_column("rows_failed", Integer, nullable=False, default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column("is_active", Boolean, nullable=False, default=False)
    replaced_file_id: Mapped[int | None] = mapped_column("replaced_file_id", BigInteger, ForeignKey("dl_import_file.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column("created_at", DateTime(timezone=True), nullable=False, default=utcnow)
    finished_at: Mapped[datetime | None] = mapped_column("finished_at", DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column("updated_at", DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    batch: Mapped[DlImportBatch] = relationship(back_populates="files")
    contacts: Mapped[list["DlContact"]] = relationship(back_populates="import_file", cascade="all, delete-orphan")
    replaced_file: Mapped["DlImportFile | None"] = relationship("DlImportFile", remote_side=[id], backref="replacements")


class DlContact(Base):
    __tablename__ = "dl_contact"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    import_file_id: Mapped[int] = mapped_column("import_file_id", BigInteger, ForeignKey("dl_import_file.id", ondelete="CASCADE"), nullable=False)
    telegram_id: Mapped[str | None] = mapped_column("telegram_id", Text, nullable=True)
    username: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    first_name: Mapped[str | None] = mapped_column("first_name", Text, nullable=True)
    last_name: Mapped[str | None] = mapped_column("last_name", Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    region: Mapped[str | None] = mapped_column(Text, nullable=True)
    joined_at: Mapped[datetime | None] = mapped_column("joined_at", DateTime(timezone=True), nullable=True)
    channels_raw: Mapped[str | None] = mapped_column("channels_raw", Text, nullable=True)
    full_name: Mapped[str | None] = mapped_column("full_name", Text, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    vk_url: Mapped[str | None] = mapped_column("vk_url", Text, nullable=True)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)
    telegram_contact: Mapped[str | None] = mapped_column("telegram_contact", Text, nullable=True)
    instagram: Mapped[str | None] = mapped_column(Text, nullable=True)
    viber: Mapped[str | None] = mapped_column(Text, nullable=True)
    odnoklassniki: Mapped[str | None] = mapped_column(Text, nullable=True)
    birth_date_text: Mapped[str | None] = mapped_column("birth_date_text", Text, nullable=True)
    username_extra: Mapped[str | None] = mapped_column("username_extra", Text, nullable=True)
    geo: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_row_index: Mapped[int] = mapped_column("source_row_index", Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column("created_at", DateTime(timezone=True), nullable=False, default=utcnow)

    import_file: Mapped[DlImportFile] = relationship(back_populates="contacts")
