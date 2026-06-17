import logging
from datetime import UTC, datetime

from app.modules.telegram_tgmbase.mapper import TelegramTgmbaseMapper
from app.modules.telegram_tgmbase.models import DlContact, DlImportBatch, DlImportFile
from app.modules.telegram_tgmbase.parser import TelegramDlImportParser
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

logger = logging.getLogger("content-service.telegram-tgmbase.import-service")


def utcnow() -> datetime:
    return datetime.now(UTC)


def normalize_telegram_id(value: str | None) -> int | None:
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


class DlImportService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.mapper = TelegramTgmbaseMapper()
        self.parser = TelegramDlImportParser()

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

        batch.status = status
        batch.files_success = files_success
        batch.files_failed = files_failed
        batch.updated_at = utcnow()
        await self.session.commit()
        await self.session.refresh(batch)

        return {
            "batch": self.mapper.map_batch(batch),
            "files": [self.mapper.map_processed_file(f) for f in processed_files],
        }

    async def get_files(
        self, file_name: str | None = None, active_only: bool | None = None
    ) -> list[dict]:
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
        offset: int = 0,
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
            join_conditions.append(
                DlImportFile.original_file_name.ilike(f"%{file_name}%")
            )
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
            "offset": offset,
        }

    async def _process_file(
        self, batch_id: int, file_content: bytes, file_name: str
    ) -> dict:
        normalized_file_name = file_name.strip()
        logger.info(
            f"Batch {batch_id}: processing file {normalized_file_name} ({len(file_content)} bytes)"
        )

        try:
            stmt = (
                select(DlImportFile)
                .where(
                    and_(
                        DlImportFile.original_file_name == normalized_file_name,
                        DlImportFile.is_active,
                        DlImportFile.status == "DONE",
                    )
                )
                .order_by(DlImportFile.created_at.desc())
            )
            res = await self.session.execute(stmt)
            existing_active = res.scalars().first()

            if existing_active:
                logger.info(
                    f"Batch {batch_id}: file {normalized_file_name} skipped, active version already exists"
                )
                import_file = DlImportFile(
                    batch_id=batch_id,
                    original_file_name=normalized_file_name,
                    status="SKIPPED",
                    rows_total=0,
                    rows_success=0,
                    rows_failed=0,
                    error="\u0424\u0430\u0439\u043b \u0443\u0436\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d, \u043f\u043e\u0432\u0442\u043e\u0440\u043d\u0430\u044f \u0432\u044b\u0433\u0440\u0443\u0437\u043a\u0430 \u043f\u0440\u043e\u043f\u0443\u0449\u0435\u043d\u0430",
                    is_active=False,
                    finished_at=utcnow(),
                    created_at=utcnow(),
                    updated_at=utcnow(),
                )
                self.session.add(import_file)
                await self.session.commit()
                await self.session.refresh(import_file)
                return {**self.mapper.map_file(import_file), "succeeded": True}

            parsed = self.parser.parse(file_content, normalized_file_name)

            import_file = DlImportFile(
                batch_id=batch_id,
                original_file_name=parsed.original_file_name,
                status="RUNNING",
                rows_total=len(parsed.contacts),
                is_active=False,
                created_at=utcnow(),
                updated_at=utcnow(),
            )
            self.session.add(import_file)
            await self.session.commit()
            await self.session.refresh(import_file)

            contact_models = []
            for contact in parsed.contacts:
                joined_at_dt = None
                if contact.date:
                    try:
                        joined_at_dt = datetime.fromisoformat(
                            contact.date.replace("Z", "+00:00")
                        )
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
                    created_at=utcnow(),
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

            return {**self.mapper.map_file(import_file), "succeeded": True}

        except Exception as e:
            logger.error(
                f"Batch {batch_id}: error processing file {file_name}: {str(e)}",
                exc_info=True,
            )
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
                    updated_at=utcnow(),
                )
                self.session.add(failed_file)
            await self.session.commit()
            await self.session.refresh(failed_file)

            return {**self.mapper.map_file(failed_file), "succeeded": False}
