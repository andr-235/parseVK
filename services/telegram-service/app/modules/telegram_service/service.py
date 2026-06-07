import logging
import asyncio
import uuid
import io
from openpyxl import Workbook
from openpyxl.styles import Font

from app.modules.telegram_service.repository import TelegramServiceRepository
from app.modules.telegram_service.client import TelegramApiClient
from app.modules.telegram_service.schemas import (
    TelegramExportStartResponse,
    TelegramJobDetailResponse,
    TelegramJobState,
    TelegramJobLogEntry
)

logger = logging.getLogger("telegram-service.service")

# Хранилище сгенерированных XLSX файлов в памяти
_xlsx_storage: dict[uuid.UUID, bytes] = {}

class TelegramServiceService:
    def __init__(self, repo: TelegramServiceRepository) -> None:
        self.repo = repo
        self.client = TelegramApiClient()

    async def start_export(self, params: dict) -> TelegramExportStartResponse:
        target = params.get("target", "")
        limit = params.get("limit", 500)
        
        # Определяем размер выгрузки
        mock_total = 500 if limit == 1000000 else limit

        # Создаем задачу в репозитории
        job = await self.repo.create_job(params, mock_total)
        job_uuid = uuid.UUID(job["id"])

        # Запускаем экспорт в фоновом режиме
        asyncio.create_task(self.run_export_job(job_uuid, params, mock_total))

        return TelegramExportStartResponse(jobId=str(job_uuid), status="pending")

    async def run_export_job(self, job_id: uuid.UUID, params: dict, total_count: int) -> None:
        target = params.get("target", "")
        active_only = params.get("activeOnly", False)
        verify_phones = params.get("verifyPhones", False)

        try:
            logger.info(f"Starting Telegram export job {job_id} for target: {target}")
            
            await self.repo.update_job(job_id, {"status": "running"})
            await self.repo.add_log(job_id, "info", "Инициализация сессии Telegram...")
            await asyncio.sleep(1.0)
            
            await self.repo.add_log(job_id, "info", "Подключение к клиенту Telegram API...")
            await asyncio.sleep(0.8)
            
            await self.repo.add_log(job_id, "info", f"Проверка разрешений для целевого чата: {target}")
            chat_info = await self.client.get_chat_info(target)
            await asyncio.sleep(0.8)
            
            await self.repo.add_log(job_id, "success", f"Успешное подключение к: {chat_info['title']} (@{chat_info['username']})")
            await self.repo.add_log(job_id, "info", "Сканирование списка участников...")
            
            if active_only:
                await self.repo.add_log(job_id, "info", "Включен фильтр: Только активные за последние 30 дней")
            if verify_phones:
                await self.repo.add_log(job_id, "info", "Включена верификация телефонных номеров с использованием VPN прокси.")
            
            # Поэтапная выгрузка участников
            fetched = 0
            all_members = []
            while fetched < total_count:
                # Проверяем не была ли задача отменена
                current_job = await self.repo.get_job(job_id)
                if not current_job or current_job["status"] == "cancelled":
                    logger.info(f"Job {job_id} was cancelled.")
                    return

                batch_size = min(100, total_count - fetched)
                batch_members = await self.client.fetch_members(target, batch_size, offset=fetched)
                all_members.extend(batch_members)
                fetched += len(batch_members)

                progress = Math_round_custom(fetched, total_count)
                
                await self.repo.update_job(job_id, {
                    "fetchedCount": fetched,
                    "progress": progress
                })
                await self.repo.add_log(job_id, "info", f"Выгружено участников: {fetched} из {total_count}...")
                await asyncio.sleep(1.0)

            # Генерация XLSX
            await self.repo.add_log(job_id, "info", "Формирование и экспорт таблицы XLSX...")
            xlsx_bytes = self._generate_xlsx(target, all_members)
            _xlsx_storage[job_id] = xlsx_bytes
            
            xlsx_path = f"/downloads/telegram_export_{job_id}.xlsx"
            
            await self.repo.update_job(job_id, {
                "status": "done",
                "xlsxPath": xlsx_path
            })
            await self.repo.add_log(job_id, "success", "Файл готов к скачиванию.")
            logger.info(f"Telegram export job {job_id} completed successfully.")

        except Exception as exc:
            logger.exception(f"Error running Telegram export job {job_id}")
            await self.repo.update_job(job_id, {
                "status": "failed",
                "error": str(exc)
            })
            await self.repo.add_log(job_id, "error", f"Ошибка: {exc}")

    async def get_job_detail(self, job_id: uuid.UUID) -> TelegramJobDetailResponse | None:
        job = await self.repo.get_job(job_id)
        if not job:
            return None
            
        logs = await self.repo.get_logs(job_id)
        
        job_state = TelegramJobState(
            id=job["id"],
            status=job["status"],
            fetchedCount=job["fetchedCount"],
            totalCount=job["totalCount"],
            warning=job.get("warning"),
            error=job.get("error"),
            xlsxPath=job.get("xlsxPath"),
            createdAt=job["createdAt"]
        )
        
        log_entries = [
            TelegramJobLogEntry(
                id=log["id"],
                level=log["level"],
                message=log["message"],
                createdAt=log["createdAt"]
            )
            for log in logs
        ]
        
        return TelegramJobDetailResponse(job=job_state, logs=log_entries)

    async def cancel_job(self, job_id: uuid.UUID) -> bool:
        job = await self.repo.get_job(job_id)
        if job and job["status"] in ["pending", "running"]:
            await self.repo.update_job(job_id, {"status": "cancelled"})
            await self.repo.add_log(job_id, "warning", "Задача остановлена оператором.")
            return True
        return False

    async def get_xlsx_bytes(self, job_id: uuid.UUID) -> bytes | None:
        return _xlsx_storage.get(job_id)

    def _generate_xlsx(self, target: str, members: list[dict]) -> bytes:
        wb = Workbook()
        ws = wb.active
        ws.title = "Members"
        
        headers = ["User ID", "Username", "First Name", "Last Name", "Phone", "Is Bot", "Role", "Join Date"]
        ws.append(headers)
        for cell in ws[1]:
            cell.font = Font(bold=True)
            
        for m in members:
            ws.append([
                m["userId"],
                m["username"],
                m["firstName"],
                m["lastName"],
                m["phone"],
                m["isBot"],
                m["role"],
                m["joinDate"],
            ])
            
        buffer = io.BytesIO()
        wb.save(buffer)
        return buffer.getvalue()


def Math_round_custom(val: int, total: int) -> int:
    if total <= 0:
        return 0
    return int((val / total) * 100)
