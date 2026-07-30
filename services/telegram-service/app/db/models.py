from datetime import UTC, datetime
from uuid import UUID as PyUUID
from uuid import uuid4

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class TelegramJob(Base):
    __tablename__ = "telegram_jobs"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="PENDING")
    params: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    total_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    fetched_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    warning: Mapped[str | None] = mapped_column(Text, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    xlsx_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )


class TelegramJobLog(Base):
    __tablename__ = "telegram_job_logs"
    __table_args__ = (Index("ix_telegram_job_logs_job_id", "job_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    job_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("telegram_jobs.id", ondelete="CASCADE"),
        nullable=False,
    )
    level: Mapped[str] = mapped_column(String(32), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )


class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    bot: Mapped[bool] = mapped_column(Boolean, default=False)
    scam: Mapped[bool] = mapped_column(Boolean, default=False)
    premium: Mapped[bool] = mapped_column(Boolean, default=False)
    first_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    username: Mapped[str | None] = mapped_column(String(32), nullable=True)
    phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    upd_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class Message(Base):
    __tablename__ = "message"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    message_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    peer_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    from_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    forwarded: Mapped[bool | None] = mapped_column(Boolean, default=False)
    reply_to: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    media: Mapped[bool | None] = mapped_column(Boolean, default=False)
    keywords: Mapped[str | None] = mapped_column(Text, nullable=True)


class Group(Base):
    __tablename__ = "group"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    group_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    participants_count: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    region: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str | None] = mapped_column(String(512), nullable=True)
    upd_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )


class Supergroup(Base):
    __tablename__ = "supergroup"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    supergroup_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    username: Mapped[str | None] = mapped_column(String(32), nullable=True)
    participants_count: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    scam: Mapped[int] = mapped_column(Integer, default=0)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    region: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str | None] = mapped_column(String(512), nullable=True)
    upd_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )


class Channel(Base):
    __tablename__ = "channel"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    channel_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    scam: Mapped[bool] = mapped_column(Boolean, default=False)
    username: Mapped[str | None] = mapped_column(String(32), nullable=True)
    participants_count: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    region: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str | None] = mapped_column(String(512), nullable=True)
    upd_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


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

    files: Mapped[list["DlImportFile"]] = relationship(
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
    contacts: Mapped[list["DlContact"]] = relationship(
        back_populates="import_file", cascade="all, delete-orphan"
    )
    replaced_file: Mapped["DlImportFile | None"] = relationship(
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
    match_results: Mapped[list["DlMatchResult"]] = relationship(
        back_populates="contact", cascade="all, delete-orphan"
    )


class DlMatchRun(Base):
    __tablename__ = "dl_match_run"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    contacts_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    matches_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    strict_matches_total: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    username_matches_total: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    phone_matches_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    results: Mapped[list["DlMatchResult"]] = relationship(
        back_populates="run", cascade="all, delete-orphan"
    )


class DlMatchResult(Base):
    __tablename__ = "dl_match_result"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    run_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("dl_match_run.id", ondelete="CASCADE"),
        nullable=False,
    )
    dl_contact_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("dl_contact.id", ondelete="CASCADE"),
        nullable=False,
    )
    tgmbase_user_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    strict_telegram_id_match: Mapped[bool] = mapped_column(Boolean, default=False)
    username_match: Mapped[bool] = mapped_column(Boolean, default=False)
    phone_match: Mapped[bool] = mapped_column(Boolean, default=False)
    chat_activity_match: Mapped[bool] = mapped_column(Boolean, default=False)
    dl_contact_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    tgmbase_user_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )

    run: Mapped[DlMatchRun] = relationship(back_populates="results")
    contact: Mapped[DlContact] = relationship(back_populates="match_results")
    chats: Mapped[list["DlMatchResultChat"]] = relationship(
        back_populates="result", cascade="all, delete-orphan"
    )
    messages: Mapped[list["DlMatchResultMessage"]] = relationship(
        back_populates="result", cascade="all, delete-orphan"
    )


class DlMatchResultChat(Base):
    __tablename__ = "dl_match_result_chat"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    result_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("dl_match_result.id", ondelete="CASCADE"),
        nullable=False,
    )
    peer_id: Mapped[str] = mapped_column(Text, nullable=False)
    chat_type: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    is_excluded: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )

    result: Mapped[DlMatchResult] = relationship(back_populates="chats")


class DlMatchResultMessage(Base):
    __tablename__ = "dl_match_result_message"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    result_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("dl_match_result.id", ondelete="CASCADE"),
        nullable=False,
    )
    peer_id: Mapped[str] = mapped_column(Text, nullable=False)
    message_id: Mapped[str] = mapped_column(Text, nullable=False)
    message_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )

    result: Mapped[DlMatchResult] = relationship(back_populates="messages")
