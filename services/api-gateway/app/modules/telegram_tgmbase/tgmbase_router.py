from app.modules.telegram_tgmbase.service import (
    TelegramTgmbaseGatewayService,
    get_telegram_tgmbase_gateway_service,
)
from fastapi import APIRouter, Depends, Request

tgmbase_router = APIRouter()


@tgmbase_router.post("/tgmbase/search")
async def search_tgmbase(
    request: Request,
    payload: dict,
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    return await service.forward(request, "POST", "/tgmbase/search", json=payload)
