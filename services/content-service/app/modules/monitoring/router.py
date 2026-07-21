from datetime import datetime
from typing import Annotated

from app.modules.monitoring.dependencies import get_monitoring_service
from app.modules.monitoring.schemas import MonitorMessagesResponse
from app.modules.monitoring.service import MonitoringService
from fastapi import APIRouter, Depends, HTTPException, Query, status

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


def parse_list_param(param: list[str] | None) -> list[str]:
    if not param:
        return []
    res = []
    seen = set()
    for val in param:
        for part in val.split(","):
            part_trimmed = part.strip()
            if part_trimmed and part_trimmed not in seen:
                seen.add(part_trimmed)
                res.append(part_trimmed)
    return res


@router.get("/messages", response_model=MonitorMessagesResponse)
async def get_messages(
    service: Annotated[MonitoringService, Depends(get_monitoring_service)],
    keywords: list[str] = Query(default=[]),
    limit: int = Query(default=100, ge=1),
    page: int = Query(default=1, ge=1),
    from_date: datetime | None = Query(default=None, alias="from"),
    sources: list[str] = Query(default=[]),
):
    try:
        # Для поддержки множественных параметров query (например ?keywords=A&keywords=B)
        # FastAPI автоматически собирает их в список.
        normalized_limit = min(max(limit, 1), 500)
        parsed_keywords = parse_list_param(keywords)
        parsed_sources = parse_list_param(sources)
        return await service.get_messages(
            keywords=parsed_keywords,
            limit=normalized_limit,
            page=page,
            from_date=from_date,
            sources=parsed_sources,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Не удалось загрузить сообщения мониторинга: {exc}"
        ) from exc
