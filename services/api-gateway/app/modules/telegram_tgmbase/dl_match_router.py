from app.modules.telegram_tgmbase.service import (
    TelegramTgmbaseGatewayService,
    get_telegram_tgmbase_gateway_service,
)
from fastapi import APIRouter, Depends, Query, Request, Response

dl_match_router = APIRouter()


@dl_match_router.post("/telegram/dl-match/runs")
async def create_run(
    request: Request,
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    return await service.forward(request, "POST", "/telegram/dl-match/runs")


@dl_match_router.get("/telegram/dl-match/runs")
async def get_runs(
    request: Request,
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    return await service.forward(request, "GET", "/telegram/dl-match/runs")


@dl_match_router.get("/telegram/dl-match/runs/{runId}")
async def get_run_by_id(
    request: Request,
    runId: int,
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    return await service.forward(request, "GET", f"/telegram/dl-match/runs/{runId}")


@dl_match_router.get("/telegram/dl-match/runs/{runId}/results")
async def get_results(
    request: Request,
    runId: int,
    strictOnly: str | None = Query(None, alias="strictOnly"),
    usernameOnly: str | None = Query(None, alias="usernameOnly"),
    phoneOnly: str | None = Query(None, alias="phoneOnly"),
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    params = {}
    if strictOnly:
        params["strictOnly"] = strictOnly
    if usernameOnly:
        params["usernameOnly"] = usernameOnly
    if phoneOnly:
        params["phoneOnly"] = phoneOnly
    return await service.forward(request, "GET", f"/telegram/dl-match/runs/{runId}/results", params=params)


@dl_match_router.get("/telegram/dl-match/runs/{runId}/results/{resultId}/messages")
async def get_result_messages(
    request: Request,
    runId: int,
    resultId: int,
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    return await service.forward(request, "GET", f"/telegram/dl-match/runs/{runId}/results/{resultId}/messages")


@dl_match_router.post("/telegram/dl-match/runs/{runId}/excluded-chats")
async def exclude_chat(
    request: Request,
    runId: int,
    payload: dict,
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    return await service.forward(request, "POST", f"/telegram/dl-match/runs/{runId}/excluded-chats", json=payload)


@dl_match_router.delete("/telegram/dl-match/runs/{runId}/excluded-chats/{peerId}")
async def restore_chat(
    request: Request,
    runId: int,
    peerId: str,
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    return await service.forward(request, "DELETE", f"/telegram/dl-match/runs/{runId}/excluded-chats/{peerId}")


@dl_match_router.get("/telegram/dl-match/runs/{runId}/export")
async def export_run(
    request: Request,
    runId: int,
    strictOnly: str | None = Query(None, alias="strictOnly"),
    usernameOnly: str | None = Query(None, alias="usernameOnly"),
    phoneOnly: str | None = Query(None, alias="phoneOnly"),
    service: TelegramTgmbaseGatewayService = Depends(get_telegram_tgmbase_gateway_service),
):
    params = {}
    if strictOnly:
        params["strictOnly"] = strictOnly
    if usernameOnly:
        params["usernameOnly"] = usernameOnly
    if phoneOnly:
        params["phoneOnly"] = phoneOnly

    res_raw = await service.forward_raw(request, "GET", f"/telegram/dl-match/runs/{runId}/export", params=params)

    headers = {}
    for key, val in res_raw.headers.items():
        if key.lower() not in ["content-length", "content-encoding", "transfer-encoding"]:
            headers[key] = val

    return Response(
        content=res_raw.content,
        status_code=res_raw.status_code,
        headers=headers,
        media_type=res_raw.headers.get("content-type"),
    )
