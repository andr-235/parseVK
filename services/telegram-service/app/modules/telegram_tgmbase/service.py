import logging
import re
<<<<<<< HEAD:services/content-service/app/modules/telegram_tgmbase/service.py
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.telegram_tgmbase.import_service import DlImportService
from app.modules.telegram_tgmbase.match_runs import DlMatchRuns
from app.modules.telegram_tgmbase.match_processor import DlMatchProcessor
from app.modules.telegram_tgmbase.search import TelegramTgmbaseSearchService
from app.modules.telegram_tgmbase.mapper import TelegramTgmbaseMapper
=======

from app.modules.telegram_tgmbase.import_service import DlImportService
from app.modules.telegram_tgmbase.mapper import TelegramTgmbaseMapper
from app.modules.telegram_tgmbase.match_processor import DlMatchProcessor
from app.modules.telegram_tgmbase.match_runs import DlMatchRuns
from app.modules.telegram_tgmbase.search import TelegramTgmbaseSearchService
from sqlalchemy.ext.asyncio import AsyncSession
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da:services/telegram-service/app/modules/telegram_tgmbase/service.py

logger = logging.getLogger("content-service.telegram-tgmbase.service")

PHONE_CLEAN_RE = re.compile(r"[^\d+]")
USERNAME_RE = re.compile(r"^@(\w+)$")
DIGITS_ONLY_RE = re.compile(r"^\d+$")


def normalize_tgmbase_query(raw: str) -> dict:
    s = raw.strip()

    m = USERNAME_RE.match(s)
    if m:
        return {"queryType": "username", "normalizedValue": m.group(1)}

    cleaned = PHONE_CLEAN_RE.sub("", s)
    if cleaned.startswith("+") and len(cleaned) > 8 and cleaned[1:].isdigit():
        return {"queryType": "phoneNumber", "normalizedValue": cleaned}

    if DIGITS_ONLY_RE.match(s):
        return {"queryType": "telegramId", "normalizedValue": s}

    return {"queryType": "invalid", "normalizedValue": s}


class TelegramTgmbaseService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.mapper = TelegramTgmbaseMapper()
        self.import_service = DlImportService(session)
        self.match_runs = DlMatchRuns(session)
        self.match_processor = DlMatchProcessor(session)
        self.search_service = TelegramTgmbaseSearchService(session, self.mapper)

    async def upload_files(self, file_entries: list[tuple[bytes, str]]) -> dict:
        return await self.import_service.upload_files(file_entries)

    async def get_files(
        self, file_name: str | None = None, active_only: bool | None = None
    ) -> list[dict]:
        return await self.import_service.get_files(
            file_name=file_name, active_only=active_only
        )

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
        return await self.import_service.get_contacts(
            file_name=file_name,
            telegram_id=telegram_id,
            username=username,
            phone=phone,
            active_only=active_only,
            limit=limit,
            offset=offset,
        )

    async def create_run(self) -> dict:
        return await self.match_runs.create_run()

    async def get_runs(self) -> list[dict]:
        return await self.match_runs.get_runs()

    async def get_run_by_id(self, id: int) -> dict:
        return await self.match_runs.get_run_by_id(id)

    async def get_results(
        self, run_id: int, strict_only: bool = False, username_only: bool = False, phone_only: bool = False
    ) -> list[dict]:
        return await self.match_runs.get_results(
            run_id, strict_only=strict_only, username_only=username_only, phone_only=phone_only
        )

    async def get_result_messages(self, run_id: int, result_id: int) -> list[dict]:
        return await self.match_runs.get_result_messages(run_id, result_id)

    async def exclude_chat(self, run_id: int, peer_id: str) -> dict:
        return await self.match_runs.exclude_chat(run_id, peer_id)

    async def restore_chat(self, run_id: int, peer_id: str) -> dict:
        return await self.match_runs.restore_chat(run_id, peer_id)

    async def export_run(
        self, run_id: int, strict_only: bool = False, username_only: bool = False, phone_only: bool = False
    ) -> tuple[bytes, str, dict]:
        return await self.match_runs.export_run(
            run_id, strict_only=strict_only, username_only=username_only, phone_only=phone_only
        )

    async def process_run(self, run_id: int):
        await self.match_processor.process_run(run_id)

    async def search_tgmbase(self, payload: dict) -> dict:
        return await self.search_service.search(payload)
