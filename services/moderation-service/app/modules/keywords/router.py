from fastapi import APIRouter, Depends, Query, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_internal_token
from app.db.session import get_session
from app.modules.keywords.schemas import (
    KeywordCreate,
    KeywordUpdateCategory,
    KeywordResponse,
    BulkAddKeywords,
    BulkAddResponse,
    KeywordFormDto,
    KeywordFormsResponse,
    KeywordsListResponse,
    KeywordRecalculationJobResponse,
    KeywordFormsRebuildResponse,
)
from app.modules.keywords.service import KeywordsService

router = APIRouter(
    prefix="/internal/moderation/keywords",
    tags=["keywords"],
    dependencies=[Depends(require_internal_token)],
)


async def get_keywords_service(
    session: AsyncSession = Depends(get_session),
) -> KeywordsService:
    # Нам нужен session_maker для фоновых задач в KeywordsService
    from app.db.session import async_session_maker
    return KeywordsService(session, async_session_maker)


@router.get("", response_model=KeywordsListResponse)
async def get_keywords(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=100),
    search: str | None = Query(default=None),
    service: KeywordsService = Depends(get_keywords_service),
):
    return await service.get_keywords(page=page, limit=limit, search=search)


@router.post("/add", response_model=KeywordResponse)
async def add_keyword(
    payload: KeywordCreate,
    background_tasks: BackgroundTasks,
    service: KeywordsService = Depends(get_keywords_service),
):
    return await service.add_keyword(
        word=payload.word,
        category=payload.category,
        is_phrase=payload.is_phrase,
        background_tasks=background_tasks,
    )


@router.post("/bulk-add", response_model=BulkAddResponse)
async def bulk_add_keywords(
    payload: BulkAddKeywords,
    background_tasks: BackgroundTasks,
    service: KeywordsService = Depends(get_keywords_service),
):
    return await service.bulk_add_keywords(
        words=payload.words,
        background_tasks=background_tasks,
    )


@router.post("/upload-content", response_model=BulkAddResponse)
async def upload_keywords_content(
    payload: dict,  # {"content": "..."}
    background_tasks: BackgroundTasks,
    service: KeywordsService = Depends(get_keywords_service),
):
    content = payload.get("content", "")
    return await service.add_keywords_from_file(
        content=content,
        background_tasks=background_tasks,
    )


@router.patch("/{id}", response_model=KeywordResponse)
async def update_keyword_category(
    id: int,
    payload: KeywordUpdateCategory,
    service: KeywordsService = Depends(get_keywords_service),
):
    return await service.update_keyword_category(id=id, category=payload.category)


@router.delete("/all")
async def delete_all_keywords(
    service: KeywordsService = Depends(get_keywords_service),
):
    return await service.delete_all_keywords()


@router.delete("/{id}", response_model=KeywordResponse)
async def delete_keyword(
    id: int,
    service: KeywordsService = Depends(get_keywords_service),
):
    return await service.delete_keyword(id=id)


@router.get("/{id}/forms", response_model=KeywordFormsResponse)
async def get_keyword_forms(
    id: int,
    service: KeywordsService = Depends(get_keywords_service),
):
    return await service.get_keyword_forms(id=id)


@router.post("/{id}/forms/manual", response_model=KeywordFormsResponse)
async def add_manual_keyword_form(
    id: int,
    payload: KeywordFormDto,
    background_tasks: BackgroundTasks,
    service: KeywordsService = Depends(get_keywords_service),
):
    return await service.add_manual_keyword_form(
        id=id,
        form=payload.form,
        background_tasks=background_tasks
    )


@router.delete("/{id}/forms/manual", response_model=KeywordFormsResponse)
async def remove_manual_keyword_form(
    id: int,
    payload: KeywordFormDto,
    background_tasks: BackgroundTasks,
    service: KeywordsService = Depends(get_keywords_service),
):
    return await service.remove_manual_keyword_form(
        id=id,
        form=payload.form,
        background_tasks=background_tasks
    )


@router.post("/{id}/forms/exclusions", response_model=KeywordFormsResponse)
async def add_keyword_form_exclusion(
    id: int,
    payload: KeywordFormDto,
    background_tasks: BackgroundTasks,
    service: KeywordsService = Depends(get_keywords_service),
):
    return await service.add_keyword_form_exclusion(
        id=id,
        form=payload.form,
        background_tasks=background_tasks
    )


@router.delete("/{id}/forms/exclusions", response_model=KeywordFormsResponse)
async def remove_keyword_form_exclusion(
    id: int,
    payload: KeywordFormDto,
    background_tasks: BackgroundTasks,
    service: KeywordsService = Depends(get_keywords_service),
):
    return await service.remove_keyword_form_exclusion(
        id=id,
        form=payload.form,
        background_tasks=background_tasks
    )


@router.post("/recalculate-matches", response_model=KeywordFormsRebuildResponse)
async def recalculate_keyword_matches(
    service: KeywordsService = Depends(get_keywords_service),
):
    job = await service.recalculate_keyword_matches(
        requested_by="api",
        background_tasks=None,
    )
    return {
        "keywords_rebuilt": 0,
        "processed": job.processed,
        "updated": job.updated,
        "created": job.created,
        "deleted": job.deleted,
    }


@router.get("/recalculation-jobs/{id}", response_model=KeywordRecalculationJobResponse)
async def get_recalculation_job_status(
    id: int,
    service: KeywordsService = Depends(get_keywords_service),
):
    return await service.get_recalculation_job_status(job_id=id)


@router.post("/rebuild-forms", response_model=KeywordFormsRebuildResponse)
async def rebuild_keyword_forms(
    background_tasks: BackgroundTasks,
    service: KeywordsService = Depends(get_keywords_service),
):
    return await service.rebuild_keyword_forms(background_tasks=background_tasks)
