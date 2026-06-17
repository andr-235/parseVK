from app.clients.base import ServiceClient
from app.core.config import settings


class TelegramServiceClient(ServiceClient):
    def __init__(self):
        from httpx import Timeout
        super().__init__(
            service_name="Telegram",
            base_url=settings.telegram_service_base_url,
            internal_token=settings.internal_service_token,
            timeout=Timeout(timeout=30.0, connect=2.0, read=30.0, write=10.0),
        )

    async def get_xlsx_bytes(self, job_id: str, *, user_id: str, request_id: str | None = None, correlation_id: str | None = None) -> bytes:
        return await self.get_bytes(f"/internal/telegram/jobs/{job_id}/download/xlsx", user_id=user_id, request_id=request_id, correlation_id=correlation_id)
