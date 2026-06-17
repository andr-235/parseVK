import logging
from datetime import datetime, timezone
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.telegram_tgmbase.models import (
    DlContact,
    DlMatchResult,
    DlMatchResultChat,
    DlMatchResultMessage,
    DlMatchRun,
    User,
    Message,
    Group,
    Supergroup,
    Channel,
)
from app.modules.telegram_tgmbase.mapper import TelegramTgmbaseMapper

logger = logging.getLogger("content-service.telegram-tgmbase.match-processor")


class DlMatchProcessor:
    def __init__(self, session: AsyncSession, batch_size: int = 1000):
        self.session = session
        self.mapper = TelegramTgmbaseMapper()
        self.batch_size = batch_size

    async def process_run(self, run_id: int):
        logger.info(f"Starting background Telegram match processor: run_id={run_id}")

        try:
            count_stmt = select(func.count(DlContact.id))
            res_count = await self.session.execute(count_stmt)
            contacts_total = res_count.scalar() or 0

            processed_contacts = 0
            matches_total = 0
            strict_matches_total = 0
            username_matches_total = 0
            phone_matches_total = 0
            last_contact_id = None
            run_started_at = datetime.now(timezone.utc)

            while True:
                stmt = select(DlContact).options(selectinload(DlContact.import_file))
                if last_contact_id is not None:
                    stmt = stmt.where(DlContact.id > last_contact_id)
                stmt = stmt.order_by(DlContact.id.asc()).limit(self.batch_size)

                res = await self.session.execute(stmt)
                contacts = res.scalars().all()

                if not contacts:
                    break

                results = await self._build_results(run_id, contacts)
                if results:
                    await self._persist_results(results)

                processed_contacts += len(contacts)
                matches_total += len(results)
                strict_matches_total += sum(
                    1 for r in results if r["strict_telegram_id_match"]
                )
                username_matches_total += sum(
                    1 for r in results if r["username_match"]
                )
                phone_matches_total += sum(1 for r in results if r["phone_match"])
                last_contact_id = contacts[-1].id

                update_stmt = (
                    update(DlMatchRun)
                    .where(DlMatchRun.id == run_id)
                    .values(
                        contacts_total=processed_contacts,
                        matches_total=matches_total,
                        strict_matches_total=strict_matches_total,
                        username_matches_total=username_matches_total,
                        phone_matches_total=phone_matches_total,
                        updated_at=datetime.now(timezone.utc),
                    )
                )
                await self.session.execute(update_stmt)
                await self.session.commit()

                logger.info(
                    f"Match run {run_id} batch: processed {processed_contacts}/{contacts_total}, matches {len(results)}"
                )

            final_stmt = (
                update(DlMatchRun)
                .where(DlMatchRun.id == run_id)
                .values(
                    status="DONE",
                    contacts_total=contacts_total,
                    matches_total=matches_total,
                    strict_matches_total=strict_matches_total,
                    username_matches_total=username_matches_total,
                    phone_matches_total=phone_matches_total,
                    finished_at=datetime.now(timezone.utc),
                    error=None,
                )
            )
            await self.session.execute(final_stmt)
            await self.session.commit()

            elapsed = (datetime.now(timezone.utc) - run_started_at).total_seconds()
            logger.info(f"Match run {run_id} finished successfully in {elapsed}s")

        except Exception as e:
            logger.error(f"Match run {run_id} failed: {str(e)}", exc_info=True)
            await self.session.rollback()

            fail_stmt = (
                update(DlMatchRun)
                .where(DlMatchRun.id == run_id)
                .values(
                    status="FAILED",
                    finished_at=datetime.now(timezone.utc),
                    error=str(e),
                )
            )
            await self.session.execute(fail_stmt)
            await self.session.commit()

    async def _build_results(
        self, run_id: int, contacts: list[DlContact]
    ) -> list[dict]:
        strict_ids = list(
            set(
                self._normalize_telegram_id(c.telegram_id)
                for c in contacts
                if self._normalize_telegram_id(c.telegram_id) is not None
            )
        )
        usernames = list(
            set(
                c.username.strip()
                for c in contacts
                if c.username and c.username.strip()
            )
        )
        phones = list(
            set(
                c.phone.strip()
                for c in contacts
                if c.phone and c.phone.strip()
            )
        )

        strict_users = []
        username_users = []
        phone_users = []

        if strict_ids:
            res = await self.session.execute(
                select(User).where(User.user_id.in_(strict_ids))
            )
            strict_users = res.scalars().all()
        if usernames:
            res = await self.session.execute(
                select(User).where(User.username.in_(usernames))
            )
            username_users = res.scalars().all()
        if phones:
            res = await self.session.execute(
                select(User).where(User.phone.in_(phones))
            )
            phone_users = res.scalars().all()

        strict_by_id = {u.user_id: u for u in strict_users}
        username_by_val = {u.username: u for u in username_users if u.username}
        phone_by_val = {u.phone: u for u in phone_users if u.phone}

        all_matched_user_ids = list(
            set(
                u.user_id
                for u in list(strict_users) + list(username_users) + list(phone_users)
            )
        )

        activity_by_user = await self._load_chat_activity(all_matched_user_ids)

        rows = []
        for contact in contacts:
            matches = self._find_matches_for_contact(
                contact, strict_by_id, username_by_val, phone_by_val
            )
            for match in matches:
                user_id = match["user_id"]
                activity = activity_by_user.get(user_id, {"chats": [], "messages": []})

                rows.append(
                    {
                        "run_id": run_id,
                        "dl_contact_id": contact.id,
                        "tgmbase_user_id": user_id,
                        "strict_telegram_id_match": match[
                            "strict_telegram_id_match"
                        ],
                        "username_match": match["username_match"],
                        "phone_match": match["phone_match"],
                        "chat_activity_match": len(activity["chats"]) > 0,
                        "dl_contact_snapshot": self.mapper.build_dl_contact_snapshot(
                            contact
                        ),
                        "tgmbase_user_snapshot": self.mapper.build_user_snapshot(
                            match["snapshot"], activity["chats"]
                        ),
                        "chats": activity["chats"],
                        "messages": activity["messages"],
                    }
                )
        return rows

    def _find_matches_for_contact(
        self,
        contact: DlContact,
        strict_by_id: dict,
        username_by_val: dict,
        phone_by_val: dict,
    ) -> list[dict]:
        c_tg_id = self._normalize_telegram_id(contact.telegram_id)
        c_username = contact.username.strip() if contact.username else None
        c_phone = contact.phone.strip() if contact.phone else None

        merged = {}

        if c_tg_id in strict_by_id:
            u = strict_by_id[c_tg_id]
            merged[u.user_id] = {
                "user_id": u.user_id,
                "strict_telegram_id_match": True,
                "username_match": False,
                "phone_match": False,
                "snapshot": u,
            }
        if c_username in username_by_val:
            u = username_by_val[c_username]
            entry = merged.setdefault(
                u.user_id,
                {
                    "user_id": u.user_id,
                    "strict_telegram_id_match": False,
                    "username_match": True,
                    "phone_match": False,
                    "snapshot": u,
                },
            )
            entry["username_match"] = True
        if c_phone in phone_by_val:
            u = phone_by_val[c_phone]
            entry = merged.setdefault(
                u.user_id,
                {
                    "user_id": u.user_id,
                    "strict_telegram_id_match": False,
                    "username_match": False,
                    "phone_match": True,
                    "snapshot": u,
                },
            )
            entry["phone_match"] = True

        return list(merged.values())

    async def _load_chat_activity(self, user_ids: list[int]) -> dict:
        lookup = {}
        if not user_ids:
            return lookup

        stmt = (
            select(Message)
            .where(Message.from_id.in_(user_ids))
            .order_by(Message.date.desc())
        )
        res = await self.session.execute(stmt)
        messages = res.scalars().all()

        peer_ids = list(set(msg.peer_id for msg in messages))
        if not peer_ids:
            return lookup

        groups_stmt = select(Group).where(Group.group_id.in_(peer_ids))
        res = await self.session.execute(groups_stmt)
        groups = {g.group_id: g for g in res.scalars().all()}

        supergroups_stmt = select(Supergroup).where(
            Supergroup.supergroup_id.in_(peer_ids)
        )
        res = await self.session.execute(supergroups_stmt)
        supergroups = {sg.supergroup_id: sg for sg in res.scalars().all()}

        channels_stmt = select(Channel).where(Channel.channel_id.in_(peer_ids))
        res = await self.session.execute(channels_stmt)
        channels = {c.channel_id: c for c in res.scalars().all()}

        chats_by_peer = {}
        for peer in peer_ids:
            if peer in groups:
                chats_by_peer[peer] = {
                    "type": "group",
                    "peer_id": str(peer),
                    "title": groups[peer].title,
                }
            elif peer in supergroups:
                chats_by_peer[peer] = {
                    "type": "supergroup",
                    "peer_id": str(peer),
                    "title": supergroups[peer].title,
                }
            elif peer in channels:
                chats_by_peer[peer] = {
                    "type": "channel",
                    "peer_id": str(peer),
                    "title": channels[peer].title,
                }

        for msg in messages:
            u_id = msg.from_id
            if not u_id or msg.peer_id not in chats_by_peer:
                continue

            chat = chats_by_peer[msg.peer_id]
            entry = lookup.setdefault(u_id, {"chats": [], "messages": []})

            if chat not in entry["chats"]:
                entry["chats"].append(chat)

            entry["messages"].append(
                {
                    "peer_id": chat["peer_id"],
                    "message_id": str(msg.message_id),
                    "message_date": msg.date.isoformat() if msg.date else None,
                    "text": msg.message,
                }
            )

        return lookup

    async def _persist_results(self, results: list[dict]):
        for res in results:
            async with self.session.begin_nested():
                match_res = DlMatchResult(
                    run_id=res["run_id"],
                    dl_contact_id=res["dl_contact_id"],
                    tgmbase_user_id=res["tgmbase_user_id"],
                    strict_telegram_id_match=res["strict_telegram_id_match"],
                    username_match=res["username_match"],
                    phone_match=res["phone_match"],
                    chat_activity_match=res["chat_activity_match"],
                    dl_contact_snapshot=res["dl_contact_snapshot"],
                    tgmbase_user_snapshot=res["tgmbase_user_snapshot"],
                    created_at=datetime.now(timezone.utc),
                )
                self.session.add(match_res)
                await self.session.flush()

                chat_models = []
                for chat in res["chats"]:
                    c_model = DlMatchResultChat(
                        result_id=match_res.id,
                        peer_id=chat["peer_id"],
                        chat_type=chat["type"],
                        title=chat["title"],
                        is_excluded=False,
                        created_at=datetime.now(timezone.utc),
                    )
                    chat_models.append(c_model)
                if chat_models:
                    self.session.add_all(chat_models)

                msg_models = []
                for msg in res["messages"]:
                    date_dt = None
                    if msg["message_date"]:
                        try:
                            date_dt = datetime.fromisoformat(msg["message_date"])
                        except Exception:
                            pass

                    m_model = DlMatchResultMessage(
                        result_id=match_res.id,
                        peer_id=msg["peer_id"],
                        message_id=msg["message_id"],
                        message_date=date_dt,
                        text=msg["text"],
                        created_at=datetime.now(timezone.utc),
                    )
                    msg_models.append(m_model)
                if msg_models:
                    self.session.add_all(msg_models)

            await self.session.commit()

    @staticmethod
    def _normalize_telegram_id(value: str | None) -> int | None:
        if not value:
            return None
        s = str(value).strip()
        if not s:
            return None
        if s.isdigit():
            return int(s)
        if s.startswith("-") and s[1:].isdigit():
            return int(s)
        return None
