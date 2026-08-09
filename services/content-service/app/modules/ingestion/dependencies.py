from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.modules.ingestion.receipt_repository import IngestionReceiptRepository


async def get_ingestion_receipt_repository(
    session: AsyncSession = Depends(get_session),
) -> IngestionReceiptRepository:
    return IngestionReceiptRepository(session)
