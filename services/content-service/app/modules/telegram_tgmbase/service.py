import logging
import asyncio
from datetime import datetime, timezone
from sqlalchemy import select, and_, func, update, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.telegram_tgmbase.models import (
    DlImportBatch, DlImportFile, DlContact,
    DlMatchRun, DlMatchResult, DlMatchResultChat, DlMatchResultMessage,
    User, Message, Group, Supergroup, Channel
)
from app.modules.telegram_tgmbase.exporter import TelegramDlMatchExporter
from app.modules.telegram_tgmbase.mapper import TelegramTgmbaseMapper
from app.modules.telegram_tgmbase.parser import TelegramDlImportParser
from app.modules.telegram_tgmbase.search import TelegramTgmbaseSearchService, normalize_tgmbase_query

logger = logging.getLogger("content-service.telegram-tgmbase.service")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def normalize_telegram_id(value: str | None) -> int | None:
    if not value:
        return None
    s = str(value).strip()
    if not s:
        return None
    # Если это число, или число с минусом
    if s.isdigit():
        return int(s)
    if s.startswith("-") and s[1:].isdigit():
        return int(s)
    return None



class TelegramTgmbaseService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.mapper = TelegramTgmbaseMapper()
        self.parser = TelegramDlImportParser()
        self.exporter = TelegramDlMatchExporter()
        self.search_service = TelegramTgmbaseSearchService(session, self.mapper)
        self.batch_size = 1000

    # Раздел DL IMPORT

    async def upload_files(self, file_entries: list[tuple[bytes, str]]) -> dict:
        logger.info(f"Starting batch Telegram DL upload: {len(file_entries)} files")
        
        batch = DlImportBatch(
            status="RUNNING",
            files_total=len(file_entries),
            files_success=0,
            files_failed=0,
            created_at=utcnow(),
            updated_at=utcnow(),
        )
        self.session.add(batch)
        await self.session.commit()
        await self.session.refresh(batch)

        processed_files = []
        for file_content, file_name in file_entries:
            res = await self._process_file(batch.id, file_content, file_name)
            processed_files.append(res)

        files_success = sum(1 for f in processed_files if f["succeeded"])
        files_failed = len(processed_files) - files_success
        status = "PARTIAL" if files_failed > 0 else "DONE"

        logger.info(
            f"Batch {batch.id} finished: success {files_success}, failed {files_failed}"
        )

        batch.status = status
        batch.files_success = files_success
        batch.files_failed = files_failed
        batch.updated_at = utcnow()
        await self.session.commit()
        await self.session.refresh(batch)

        return {
            "batch": self.mapper.map_batch(batch),
            "files": [self.mapper.map_processed_file(f) for f in processed_files]
        }

    async def get_files(self, file_name: str | None = None, active_only: bool | None = None) -> list[dict]:
        stmt = select(DlImportFile)
        conditions = []
        if file_name:
            conditions.append(DlImportFile.original_file_name == file_name)
        if active_only is not None:
            conditions.append(DlImportFile.is_active == active_only)
        if conditions:
            stmt = stmt.where(and_(*conditions))
        
        stmt = stmt.order_by(DlImportFile.created_at.desc())
        res = await self.session.execute(stmt)
        files = res.scalars().all()
        return [self.mapper.map_file(f) for f in files]

    async def get_contacts(
        self,
        file_name: str | None = None,
        telegram_id: str | None = None,
        username: str | None = None,
        phone: str | None = None,
        active_only: bool | None = None,
        limit: int = 100,
        offset: int = 0
    ) -> dict:
        conditions = []
        if telegram_id:
            conditions.append(DlContact.telegram_id.ilike(f"%{telegram_id}%"))
        if username:
            conditions.append(DlContact.username.ilike(f"%{username}%"))
        if phone:
            conditions.append(DlContact.phone.ilike(f"%{phone}%"))

        join_conditions = []
        if file_name:
            join_conditions.append(DlImportFile.original_file_name.ilike(f"%{file_name}%"))
        if active_only is not None:
            join_conditions.append(DlImportFile.is_active == active_only)

        stmt = select(DlContact).join(DlImportFile)
        count_stmt = select(func.count(DlContact.id)).join(DlImportFile)

        if conditions:
            stmt = stmt.where(and_(*conditions))
            count_stmt = count_stmt.where(and_(*conditions))
        if join_conditions:
            stmt = stmt.where(and_(*join_conditions))
            count_stmt = count_stmt.where(and_(*join_conditions))

        res_count = await self.session.execute(count_stmt)
        total = res_count.scalar() or 0

        stmt = stmt.options(selectinload(DlContact.import_file))
        stmt = stmt.order_by(DlContact.created_at.desc()).limit(limit).offset(offset)
        res = await self.session.execute(stmt)
        items = res.scalars().all()

        return {
            "items": [self.mapper.map_contact(i) for i in items],
            "total": total,
            "limit": limit,
            "offset": offset
        }

    # Раздел DL MATCH (СОПОСТАВЛЕНИЯ)

    async def create_run(self) -> dict:
        run = DlMatchRun(
            status="RUNNING",
            contacts_total=0,
            matches_total=0,
            strict_matches_total=0,
            username_matches_total=0,
            phone_matches_total=0,
            created_at=utcnow(),
        )
        self.session.add(run)
        await self.session.commit()
        await self.session.refresh(run)
        return self.mapper.map_run(run)

    async def get_runs(self) -> list[dict]:
        stmt = select(DlMatchRun).order_by(DlMatchRun.created_at.desc())
        res = await self.session.execute(stmt)
        runs = res.scalars().all()
        return [self.mapper.map_run(r) for r in runs]

    async def get_run_by_id(self, id: int) -> dict:
        stmt = select(DlMatchRun).where(DlMatchRun.id == id)
        res = await self.session.execute(stmt)
        run = res.scalars().first()
        if not run:
            raise ValueError(f"Run {id} not found")
        return self.mapper.map_run(run)

    async def get_results(
        self,
        run_id: int,
        strict_only: bool = False,
        username_only: bool = False,
        phone_only: bool = False
    ) -> list[dict]:
        stmt = select(DlMatchResult).where(DlMatchResult.run_id == run_id)
        
        # Сигналы активности
        stmt = stmt.where(or_(
            DlMatchResult.strict_telegram_id_match == True,
            DlMatchResult.username_match == True,
            DlMatchResult.phone_match == True,
            DlMatchResult.chat_activity_match == True
        ))

        if strict_only:
            stmt = stmt.where(DlMatchResult.strict_telegram_id_match == True)
        if username_only:
            stmt = stmt.where(DlMatchResult.username_match == True)
        if phone_only:
            stmt = stmt.where(DlMatchResult.phone_match == True)

        stmt = stmt.options(selectinload(DlMatchResult.chats)).order_by(DlMatchResult.created_at.desc())
        res = await self.session.execute(stmt)
        items = res.scalars().all()

        # Фильтруем результаты, у которых есть чаты, но все они исключены
        filtered = []
        for item in items:
            total_chats = len(item.chats)
            active_chats = sum(1 for c in item.chats if not c.is_excluded)
            if total_chats == 0 or active_chats > 0:
                filtered.append(self.mapper.map_result(item))
                
        return filtered

    async def get_result_messages(self, run_id: int, result_id: int) -> list[dict]:
        stmt = select(DlMatchResult).where(
            and_(DlMatchResult.id == result_id, DlMatchResult.run_id == run_id)
        ).options(
            selectinload(DlMatchResult.chats),
            selectinload(DlMatchResult.messages)
        )
        res = await self.session.execute(stmt)
        result = res.scalars().first()
        if not result:
            raise ValueError(f"Result {result_id} not found in run {run_id}")

        messages_by_peer = {}
        for msg in result.messages:
            messages_by_peer.setdefault(msg.peer_id, []).append(msg)

        sorted_chats = sorted(result.chats, key=lambda c: c.peer_id)
        
        return [
            {
                "peerId": chat.peer_id,
                "chatType": chat.chat_type,
                "title": chat.title,
                "isExcluded": chat.is_excluded,
                "messages": [
                    {
                        "messageId": m.message_id,
                        "messageDate": m.message_date.isoformat() if m.message_date else None,
                        "text": m.text
                    }
                    for m in sorted(messages_by_peer.get(chat.peer_id, []), key=lambda m: (m.message_date or datetime.min, m.message_id), reverse=True)
                ]
            }
            for chat in sorted_chats
        ]

    async def exclude_chat(self, run_id: int, peer_id: str) -> dict:
        await self._update_excluded_chat_state(run_id, peer_id, True)
        return await self.get_run_by_id(run_id)

    async def restore_chat(self, run_id: int, peer_id: str) -> dict:
        await self._update_excluded_chat_state(run_id, peer_id, False)
        return await self.get_run_by_id(run_id)

    async def export_run(self, run_id: int, strict_only: bool = False, username_only: bool = False, phone_only: bool = False) -> tuple[bytes, str, dict]:
        run = await self.get_run_by_id(run_id)
        if run["status"] != "DONE":
            raise ValueError("Run is not completed yet")
            
        results = await self.get_results(run_id, strict_only, username_only, phone_only)
        
        # Загружаем сообщения для результатов
        result_ids = [int(r["id"]) for r in results]
        messages_by_result_id = {}
        for r_id in result_ids:
            messages_by_result_id[str(r_id)] = await self.get_result_messages(run_id, r_id)

        buffer = await self.exporter.export_run(str(run_id), results, messages_by_result_id)
        return buffer, f"dl-match-run-{run_id}.xlsx", run

    # ФОНОВЫЙ ПРОЦЕССОР МЭТЧИНГА

    async def process_run(self, run_id: int):
        logger.info(f"Starting background Telegram match processor: run_id={run_id}")
        
        try:
            # Считаем число контактов
            count_stmt = select(func.count(DlContact.id))
            res_count = await self.session.execute(count_stmt)
            contacts_total = res_count.scalar() or 0

            processed_contacts = 0
            matches_total = 0
            strict_matches_total = 0
            username_matches_total = 0
            phone_matches_total = 0
            last_contact_id = None
            run_started_at = utcnow()

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
                strict_matches_total += sum(1 for r in results if r["strict_telegram_id_match"])
                username_matches_total += sum(1 for r in results if r["username_match"])
                phone_matches_total += sum(1 for r in results if r["phone_match"])
                last_contact_id = contacts[-1].id

                # Обновляем прогресс в БД
                update_stmt = update(DlMatchRun).where(DlMatchRun.id == run_id).values(
                    contacts_total=processed_contacts,
                    matches_total=matches_total,
                    strict_matches_total=strict_matches_total,
                    username_matches_total=username_matches_total,
                    phone_matches_total=phone_matches_total,
                    updated_at=utcnow()
                )
                await self.session.execute(update_stmt)
                await self.session.commit()

                logger.info(
                    f"Match run {run_id} batch: processed {processed_contacts}/{contacts_total}, matches {len(results)}"
                )

            # Завершаем
            final_stmt = update(DlMatchRun).where(DlMatchRun.id == run_id).values(
                status="DONE",
                contacts_total=contacts_total,
                matches_total=matches_total,
                strict_matches_total=strict_matches_total,
                username_matches_total=username_matches_total,
                phone_matches_total=phone_matches_total,
                finished_at=utcnow(),
                error=None
            )
            await self.session.execute(final_stmt)
            await self.session.commit()
            
            logger.info(f"Match run {run_id} finished successfully in {(utcnow() - run_started_at).total_seconds()}s")

        except Exception as e:
            logger.error(f"Match run {run_id} failed: {str(e)}", exc_info=True)
            await self.session.rollback()
            
            fail_stmt = update(DlMatchRun).where(DlMatchRun.id == run_id).values(
                status="FAILED",
                finished_at=utcnow(),
                error=str(e)
            )
            await self.session.execute(fail_stmt)
            await self.session.commit()

    # ВНУТРЕННИЕ МЕТОДЫ И ХЕЛПЕРЫ

    async def _process_file(self, batch_id: int, file_content: bytes, file_name: str) -> dict:
        normalized_file_name = file_name.strip()
        logger.info(f"Batch {batch_id}: processing file {normalized_file_name} ({len(file_content)} bytes)")

        try:
            stmt = select(DlImportFile).where(
                and_(
                    DlImportFile.original_file_name == normalized_file_name,
                    DlImportFile.is_active == True,
                    DlImportFile.status == "DONE"
                )
            ).order_by(DlImportFile.created_at.desc())
            res = await self.session.execute(stmt)
            existing_active = res.scalars().first()

            if existing_active:
                logger.info(f"Batch {batch_id}: file {normalized_file_name} skipped, active version already exists")
                import_file = DlImportFile(
                    batch_id=batch_id,
                    original_file_name=normalized_file_name,
                    status="SKIPPED",
                    rows_total=0,
                    rows_success=0,
                    rows_failed=0,
                    error="Файл уже загружен, повторная выгрузка пропущена",
                    is_active=False,
                    finished_at=utcnow(),
                    created_at=utcnow(),
                    updated_at=utcnow()
                )
                self.session.add(import_file)
                await self.session.commit()
                await self.session.refresh(import_file)
                return {
                    **self.mapper.map_file(import_file),
                    "succeeded": True
                }

            parsed = self.parser.parse(file_content, normalized_file_name)

            import_file = DlImportFile(
                batch_id=batch_id,
                original_file_name=parsed.original_file_name,
                status="RUNNING",
                rows_total=len(parsed.contacts),
                is_active=False,
                created_at=utcnow(),
                updated_at=utcnow()
            )
            self.session.add(import_file)
            await self.session.commit()
            await self.session.refresh(import_file)

            contact_models = []
            for contact in parsed.contacts:
                joined_at_dt = None
                if contact.date:
                    try:
                        joined_at_dt = datetime.fromisoformat(contact.date.replace("Z", "+00:00"))
                    except Exception:
                        pass
                
                c_model = DlContact(
                    import_file_id=import_file.id,
                    telegram_id=contact.telegram_id,
                    username=contact.username,
                    phone=contact.phone,
                    first_name=contact.first_name,
                    last_name=contact.last_name,
                    description=contact.description,
                    region=contact.region,
                    joined_at=joined_at_dt,
                    channels_raw=contact.channels,
                    full_name=contact.full_name,
                    address=contact.address,
                    vk_url=contact.vk_url,
                    email=contact.email,
                    telegram_contact=contact.telegram_contact,
                    instagram=contact.instagram,
                    viber=contact.viber,
                    odnoklassniki=contact.odnoklassniki,
                    birth_date_text=contact.birth_date,
                    username_extra=contact.username_extra,
                    geo=contact.geo,
                    source_row_index=contact.source_row_index,
                    created_at=utcnow()
                )
                contact_models.append(c_model)

            if contact_models:
                self.session.add_all(contact_models)
                await self.session.flush()

            import_file.status = "DONE"
            import_file.rows_success = len(parsed.contacts)
            import_file.rows_failed = 0
            import_file.is_active = True
            import_file.finished_at = utcnow()
            import_file.updated_at = utcnow()
            await self.session.commit()
            await self.session.refresh(import_file)

            return {
                **self.mapper.map_file(import_file),
                "succeeded": True
            }

        except Exception as e:
            logger.error(f"Batch {batch_id}: error processing file {file_name}: {str(e)}", exc_info=True)
            await self.session.rollback()
            
            async with self.session.begin_nested():
                failed_file = DlImportFile(
                    batch_id=batch_id,
                    original_file_name=normalized_file_name,
                    status="FAILED",
                    rows_total=0,
                    rows_success=0,
                    rows_failed=0,
                    error=str(e),
                    is_active=False,
                    finished_at=utcnow(),
                    created_at=utcnow(),
                    updated_at=utcnow()
                )
                self.session.add(failed_file)
            await self.session.commit()
            await self.session.refresh(failed_file)

            return {
                **self.mapper.map_file(failed_file),
                "succeeded": False
            }

    async def _build_results(self, run_id: int, contacts: list[DlContact]) -> list[dict]:
        strict_ids = list(set(
            normalize_telegram_id(c.telegram_id)
            for c in contacts
            if normalize_telegram_id(c.telegram_id) is not None
        ))
        usernames = list(set(
            c.username.strip()
            for c in contacts
            if c.username and c.username.strip()
        ))
        phones = list(set(
            c.phone.strip()
            for c in contacts
            if c.phone and c.phone.strip()
        ))

        # Загружаем пользователей tgmbase
        strict_users = []
        username_users = []
        phone_users = []

        if strict_ids:
            res = await self.session.execute(select(User).where(User.user_id.in_(strict_ids)))
            strict_users = res.scalars().all()
        if usernames:
            res = await self.session.execute(select(User).where(User.username.in_(usernames)))
            username_users = res.scalars().all()
        if phones:
            res = await self.session.execute(select(User).where(User.phone.in_(phones)))
            phone_users = res.scalars().all()

        strict_by_id = {u.user_id: u for u in strict_users}
        username_by_val = {u.username: u for u in username_users if u.username}
        phone_by_val = {u.phone: u for u in phone_users if u.phone}

        all_matched_user_ids = list(set(
            u.user_id
            for u in list(strict_users) + list(username_users) + list(phone_users)
        ))

        # Загружаем сообщения
        activity_by_user = await self._load_chat_activity(all_matched_user_ids)

        rows = []
        for contact in contacts:
            matches = self._find_matches_for_contact(contact, strict_by_id, username_by_val, phone_by_val)
            for match in matches:
                user_id = match["user_id"]
                activity = activity_by_user.get(user_id, {"chats": [], "messages": []})
                
                rows.append({
                    "run_id": run_id,
                    "dl_contact_id": contact.id,
                    "tgmbase_user_id": user_id,
                    "strict_telegram_id_match": match["strict_telegram_id_match"],
                    "username_match": match["username_match"],
                    "phone_match": match["phone_match"],
                    "chat_activity_match": len(activity["chats"]) > 0,
                    "dl_contact_snapshot": self.mapper.build_dl_contact_snapshot(contact),
                    "tgmbase_user_snapshot": self.mapper.build_user_snapshot(match["snapshot"], activity["chats"]),
                    "chats": activity["chats"],
                    "messages": activity["messages"]
                })
        return rows

    def _find_matches_for_contact(self, contact: DlContact, strict_by_id: dict, username_by_val: dict, phone_by_val: dict) -> list[dict]:
        c_tg_id = normalize_telegram_id(contact.telegram_id)
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
                "snapshot": u
            }
        if c_username in username_by_val:
            u = username_by_val[c_username]
            entry = merged.setdefault(u.user_id, {
                "user_id": u.user_id,
                "strict_telegram_id_match": False,
                "username_match": True,
                "phone_match": False,
                "snapshot": u
            })
            entry["username_match"] = True
        if c_phone in phone_by_val:
            u = phone_by_val[c_phone]
            entry = merged.setdefault(u.user_id, {
                "user_id": u.user_id,
                "strict_telegram_id_match": False,
                "username_match": False,
                "phone_match": True,
                "snapshot": u
            })
            entry["phone_match"] = True

        return list(merged.values())

    async def _load_chat_activity(self, user_ids: list[int]) -> dict:
        lookup = {}
        if not user_ids:
            return lookup

        # Выбираем сообщения
        stmt = select(Message).where(Message.from_id.in_(user_ids)).order_by(Message.date.desc())
        res = await self.session.execute(stmt)
        messages = res.scalars().all()

        peer_ids = list(set(msg.peer_id for msg in messages))
        if not peer_ids:
            return lookup

        # Загружаем группы, супергруппы, каналы
        groups_stmt = select(Group).where(Group.group_id.in_(peer_ids))
        res = await self.session.execute(groups_stmt)
        groups = {g.group_id: g for g in res.scalars().all()}

        supergroups_stmt = select(Supergroup).where(Supergroup.supergroup_id.in_(peer_ids))
        res = await self.session.execute(supergroups_stmt)
        supergroups = {sg.supergroup_id: sg for sg in res.scalars().all()}

        channels_stmt = select(Channel).where(Channel.channel_id.in_(peer_ids))
        res = await self.session.execute(channels_stmt)
        channels = {c.channel_id: c for c in res.scalars().all()}

        chats_by_peer = {}
        for peer in peer_ids:
            if peer in groups:
                chats_by_peer[peer] = {"type": "group", "peer_id": str(peer), "title": groups[peer].title}
            elif peer in supergroups:
                chats_by_peer[peer] = {"type": "supergroup", "peer_id": str(peer), "title": supergroups[peer].title}
            elif peer in channels:
                chats_by_peer[peer] = {"type": "channel", "peer_id": str(peer), "title": channels[peer].title}

        for msg in messages:
            u_id = msg.from_id
            if not u_id or msg.peer_id not in chats_by_peer:
                continue
                
            chat = chats_by_peer[msg.peer_id]
            entry = lookup.setdefault(u_id, {"chats": [], "messages": []})
            
            if chat not in entry["chats"]:
                entry["chats"].append(chat)
                
            entry["messages"].append({
                "peer_id": chat["peer_id"],
                "message_id": str(msg.message_id),
                "message_date": msg.date.isoformat() if msg.date else None,
                "text": msg.message
            })
            
        return lookup

    async def _persist_results(self, results: list[dict]):
        for res in results:
            async with self.session.begin_nested():
                # Создаем результат
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
                    created_at=utcnow()
                )
                self.session.add(match_res)
                await self.session.flush()

                # Создаем чаты
                chat_models = []
                for chat in res["chats"]:
                    c_model = DlMatchResultChat(
                        result_id=match_res.id,
                        peer_id=chat["peer_id"],
                        chat_type=chat["type"],
                        title=chat["title"],
                        is_excluded=False,
                        created_at=utcnow()
                    )
                    chat_models.append(c_model)
                if chat_models:
                    self.session.add_all(chat_models)

                # Создаем сообщения
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
                        created_at=utcnow()
                    )
                    msg_models.append(m_model)
                if msg_models:
                    self.session.add_all(msg_models)
                    
            await self.session.commit()

    async def _update_excluded_chat_state(self, run_id: int, peer_id: str, is_excluded: bool):
        # Загружаем связанные чаты
        stmt = select(DlMatchResultChat).join(DlMatchResult).where(
            and_(DlMatchResultChat.peer_id == peer_id, DlMatchResult.run_id == run_id)
        )
        res = await self.session.execute(stmt)
        affected_chats = res.scalars().all()

        if not affected_chats:
            return

        affected_result_ids = list(set(c.result_id for c in affected_chats))

        # Обновляем статус исключения в транзакции
        async with self.session.begin_nested():
            for chat in affected_chats:
                chat.is_excluded = is_excluded
            await self.session.flush()

            # Обновляем признак chat_activity_match в DlMatchResult
            for r_id in affected_result_ids:
                # Проверяем, есть ли оставшиеся не исключенные чаты
                c_stmt = select(func.count(DlMatchResultChat.id)).where(
                    and_(
                        DlMatchResultChat.result_id == r_id,
                        DlMatchResultChat.is_excluded == False
                    )
                )
                c_res = await self.session.execute(c_stmt)
                active_count = c_res.scalar() or 0

                res_stmt = select(DlMatchResult).where(DlMatchResult.id == r_id)
                res_obj = (await self.session.execute(res_stmt)).scalar()
                if res_obj:
                    res_obj.chat_activity_match = active_count > 0

            await self.session.flush()

            # Обновляем статистику в DlMatchRun
            results_stmt = select(DlMatchResult).where(
                and_(
                    DlMatchResult.run_id == run_id,
                    or_(
                        DlMatchResult.strict_telegram_id_match == True,
                        DlMatchResult.username_match == True,
                        DlMatchResult.phone_match == True,
                        DlMatchResult.chat_activity_match == True
                    )
                )
            )
            res_results = await self.session.execute(results_stmt)
            active_results = res_results.scalars().all()

            matches_total = len(active_results)
            strict_total = sum(1 for r in active_results if r.strict_telegram_id_match)
            username_total = sum(1 for r in active_results if r.username_match)
            phone_total = sum(1 for r in active_results if r.phone_match)

            run_stmt = select(DlMatchRun).where(DlMatchRun.id == run_id)
            run = (await self.session.execute(run_stmt)).scalar()
            if run:
                run.matches_total = matches_total
                run.strict_matches_total = strict_total
                run.username_matches_total = username_total
                run.phone_matches_total = phone_total
                
        await self.session.commit()


    # РАЗДЕЛ ПОИСКА ПО БАЗЕ TGMBASE
    async def search_tgmbase(self, payload: dict) -> dict:
        return await self.search_service.search(payload)