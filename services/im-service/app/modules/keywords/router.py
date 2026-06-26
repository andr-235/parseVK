import logging

from fastapi import APIRouter, Depends, Path

from app.core.security import require_internal_token, require_owner_user_id
from app.modules.keywords.dependencies import get_keywords_service
from app.modules.keywords.schemas import KeywordCreateRequest, KeywordResponse
from app.modules.keywords.service import KeywordsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal/keywords", tags=["keywords"])


@router.get("")
async def list_keywords(
    messenger: str | None = None,
    user_id: str = Depends(require_owner_user_id),
    token: str = Depends(require_internal_token),
    service: KeywordsService = Depends(get_keywords_service),
) -> list[KeywordResponse]:
    rows = await service.list_keywords(user_id, messenger)
    return [KeywordResponse.model_validate(r) for r in rows]


@router.post("", status_code=201)
async def add_keyword(
    body: KeywordCreateRequest,
    user_id: str = Depends(require_owner_user_id),
    token: str = Depends(require_internal_token),
    service: KeywordsService = Depends(get_keywords_service),
) -> KeywordResponse:
    result = await service.add_keyword(user_id, body.messenger, body.keyword)
    if result is None:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Keyword already exists")
    return KeywordResponse.model_validate(result)


@router.delete("/{keyword_id}")
async def delete_keyword(
    keyword_id: int = Path(...),
    user_id: str = Depends(require_owner_user_id),
    token: str = Depends(require_internal_token),
    service: KeywordsService = Depends(get_keywords_service),
) -> dict:
    deleted = await service.delete_keyword(keyword_id, user_id)
    if not deleted:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Keyword not found")
    return {"deleted": True}
