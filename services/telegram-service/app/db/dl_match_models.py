from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, BigInteger, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.model_utils import utcnow

if TYPE_CHECKING:
    from app.db.dl_import_models import DlContact


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

    results: Mapped[list[DlMatchResult]] = relationship(
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
    contact: Mapped[DlContact] = relationship("DlContact", back_populates="match_results")
    chats: Mapped[list[DlMatchResultChat]] = relationship(
        back_populates="result", cascade="all, delete-orphan"
    )
    messages: Mapped[list[DlMatchResultMessage]] = relationship(
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
