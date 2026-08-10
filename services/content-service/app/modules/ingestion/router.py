from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.security import require_internal_token
from app.modules.ingestion.ack_outbox import ensure_ack_outbox
from app.modules.ingestion.dependencies import (
    get_content_outbox_service,
    get_ingestion_receipt_repository,
)
from app.modules.ingestion.receipt_repository import IngestionReceiptRepository
from app.modules.projections.outbox_service import ContentOutboxService

router = APIRouter(
    prefix="/internal/ingestion",
    tags=["ingestion"],
    dependencies=[Depends(require_internal_token)],
)


class ReceiptReconciliationRequest(BaseModel):
    source_message_ids: list[UUID] = Field(
        alias="sourceMessageIds",
        min_length=1,
        max_length=500,
    )


@router.post("/receipts/reconciliation")
async def reconcile_receipts(
    request: ReceiptReconciliationRequest,
    repository: IngestionReceiptRepository = Depends(
        get_ingestion_receipt_repository
    ),
    outbox: ContentOutboxService = Depends(get_content_outbox_service),
) -> dict:
    source_ids = list(dict.fromkeys(request.source_message_ids))
    receipts = await repository.load_applied_by_source_ids(source_ids)
    items = []
    for receipt in receipts:
        payload = await ensure_ack_outbox(repository, outbox, receipt)
        items.append(
            {
                "ackEventId": str(receipt.ack_event_id),
                "payload": payload,
            }
        )
    return {"items": items}
