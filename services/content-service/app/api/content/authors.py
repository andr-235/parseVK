from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.content.dependencies import get_author_commands, get_author_query
from app.api.content.schemas import IntegerList
from app.core.security import require_internal_token
from app.domain.content.errors import InvalidFilterError
from app.services.content.author_commands import AuthorCommandService
from app.services.content.authors import AuthorQueryService

router = APIRouter(prefix="/authors")
QueryService = Annotated[AuthorQueryService, Depends(get_author_query)]
CommandService = Annotated[AuthorCommandService, Depends(get_author_commands)]


@router.get("")
async def list_authors(
    service: QueryService,
    limit: int = Query(20, ge=1, le=100),
    page: int | None = Query(None, ge=1),
    offset: int | None = Query(None, ge=0),
    search: str | None = None,
    city: str | None = None,
    verified: str | None = None,
    type: str | None = None,
    sort_by: str | None = Query(None, alias="sortBy"),
    sort_order: str = Query("desc", alias="sortOrder"),
):
    try:
        return await service.list_authors(
            limit=limit, page=page, offset=offset, search=search, city=city,
            verified=verified, author_type=type, sort_by=sort_by,
            sort_order=sort_order,
        )
    except InvalidFilterError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{vk_author_id}")
async def get_author(vk_author_id: int, service: QueryService):
    author = await service.get_author(vk_author_id)
    if author is None:
        raise HTTPException(status_code=404, detail="Author not found")
    return author


@router.post("/bulk")
async def bulk_authors(payload: IntegerList, service: QueryService):
    return await service.list_authors_bulk(payload.root)


@router.patch("/{vk_author_id}/verify")
async def verify_author(vk_author_id: int, service: CommandService):
    if not await service.verify_author(vk_author_id):
        raise HTTPException(status_code=404, detail="Author not found")
    return {"status": "success"}


@router.post("/refresh")
async def refresh_authors(service: CommandService):
    return {"updated": await service.refresh_authors()}


@router.delete("/{vk_author_id}", dependencies=[Depends(require_internal_token)])
async def delete_author(vk_author_id: int, service: CommandService):
    if not await service.delete_author(vk_author_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author not found")
    return {"deleted": True}
