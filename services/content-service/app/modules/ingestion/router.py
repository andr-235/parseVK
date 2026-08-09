from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.security import require_internal_token
from app.modules.ingestion.ack import ack_payload
from app.modules.ingestion.dependencies import get_ingestion_receipt_repository
from app.modules.ingestion.receipt_repository import IngestionReceiptRepository

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
) -> dict:
    source_ids = list(dict.fromkeys(request.source_message_ids))
    receipts = await repository.load_applied_by_source_ids(source_ids)
    return {
        "items": [
            {
                "ackEventId": str(receipt.ack_event_id),
                "payload": ack_payload(receipt),
            }
            for receipt in receipts
        ]
    }
