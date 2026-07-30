from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.model_utils import utcnow


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
