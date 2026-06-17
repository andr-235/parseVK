import logging

<<<<<<< HEAD
from sqlalchemy import select, delete, and_
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

import httpx
from app.core.config import settings
from app.db.models import PhotoAnalysis
=======
import httpx
from app.core.config import settings
from app.db.models import PhotoAnalysis
from app.modules.photo_analysis.api_client import PhotoAnalysisClient
from app.modules.photo_analysis.mappers import (
    build_summary_dto,
    map_item_to_schema,
    utcnow,
)
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
from app.modules.photo_analysis.schemas import (
    AnalyzePhotosSchema,
    PhotoAnalysisListSchema,
    PhotoAnalysisSummarySchema,
)
<<<<<<< HEAD
from app.modules.photo_analysis.api_client import PhotoAnalysisClient
from app.modules.photo_analysis.mappers import (
    utcnow,
    map_item_to_schema,
    build_summary_dto,
)
=======
from sqlalchemy import and_, delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da

logger = logging.getLogger("moderation-service.photo-analysis.service")


class PhotoAnalysisService:
    def __init__(self, session: AsyncSession):
        self.session = session
        svc = self
        self.client = PhotoAnalysisClient(
            http=lambda: svc._http_client(),
        )

    def _http_client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(headers={"X-Internal-Service-Token": settings.internal_service_token}, timeout=httpx.Timeout(15.0))

    async def analyze_by_vk_user(self, vk_user_id: int, options: AnalyzePhotosSchema) -> PhotoAnalysisListSchema:
        logger.info("Starting photo analysis for vk_user_id=%d, limit=%s, force=%s", vk_user_id, options.limit, options.force)
        photos_to_process = await self.client.prepare_photos(vk_user_id, options)
        if not photos_to_process:
            logger.info("No photos found, marking author verified")
            await self.client.verify_author(vk_user_id)
            return await self.list_by_vk_user(vk_user_id)

        if not options.force:
            vk_ids = [p["photo_vk_id"] for p in photos_to_process]
            stmt = select(PhotoAnalysis.photo_vk_id).where(
                and_(PhotoAnalysis.author_vk_id == vk_user_id, PhotoAnalysis.photo_vk_id.in_(vk_ids))
            )
            res = await self.session.execute(stmt)
            existing_ids = set(res.scalars().all())
            photos_to_process = [p for p in photos_to_process if p["photo_vk_id"] not in existing_ids]

        if not photos_to_process:
            logger.info("All photos already analyzed")
            await self.client.verify_author(vk_user_id)
            return await self.list_by_vk_user(vk_user_id)

        image_urls = [p["url"] for p in photos_to_process]
        adapted_results = await self.client.moderate_photos(image_urls)
        now = utcnow()

        for idx, p in enumerate(photos_to_process):
            adapted = adapted_results[idx] if idx < len(adapted_results) else {}
            stmt = insert(PhotoAnalysis).values(
                author_vk_id=vk_user_id,
                photo_url=p["url"],
                photo_vk_id=p["photo_vk_id"],
                analysis_result=adapted,
                has_suspicious=adapted["has_suspicious"],
                suspicion_level=adapted["suspicion_level"],
                categories=adapted["categories"],
                confidence=adapted["confidence"],
                explanation=adapted["explanation"],
                analyzed_at=now,
                created_at=now,
                updated_at=now,
            )
            stmt = stmt.on_conflict_do_update(
                index_elements=[PhotoAnalysis.author_vk_id, PhotoAnalysis.photo_vk_id],
                set_={
                    "photo_url": stmt.excluded.photo_url,
                    "analysis_result": stmt.excluded.analysis_result,
                    "has_suspicious": stmt.excluded.has_suspicious,
                    "suspicion_level": stmt.excluded.suspicion_level,
                    "categories": stmt.excluded.categories,
                    "confidence": stmt.excluded.confidence,
                    "explanation": stmt.excluded.explanation,
                    "analyzed_at": now,
                    "updated_at": now,
                }
            )
            await self.session.execute(stmt)

        await self.session.commit()
        await self.client.verify_author(vk_user_id)
        return await self.list_by_vk_user(vk_user_id)

    async def list_by_vk_user(self, vk_user_id: int) -> PhotoAnalysisListSchema:
        stmt = select(PhotoAnalysis).where(PhotoAnalysis.author_vk_id == vk_user_id).order_by(PhotoAnalysis.analyzed_at.desc())
        res = await self.session.execute(stmt)
        items = list(res.scalars().all())
        schema_items = [map_item_to_schema(i) for i in items]
        summary = build_summary_dto(items, len(items))
        return PhotoAnalysisListSchema(items=schema_items, total=len(items), suspiciousCount=summary.suspicious, analyzedCount=len(items), summary=summary)

    async def list_suspicious_by_vk_user(self, vk_user_id: int) -> PhotoAnalysisListSchema:
        stmt = select(PhotoAnalysis).where(
            and_(PhotoAnalysis.author_vk_id == vk_user_id, PhotoAnalysis.has_suspicious == True)
        ).order_by(PhotoAnalysis.analyzed_at.desc())
        res = await self.session.execute(stmt)
        items = list(res.scalars().all())
        schema_items = [map_item_to_schema(i) for i in items]
        total_stmt = select(PhotoAnalysis).where(PhotoAnalysis.author_vk_id == vk_user_id)
        total_res = await self.session.execute(total_stmt)
        all_items = list(total_res.scalars().all())
        summary = build_summary_dto(all_items, len(all_items))
        return PhotoAnalysisListSchema(
            items=schema_items,
            total=len(items),
            suspiciousCount=summary.suspicious,
            analyzedCount=len(all_items),
            summary=summary,
        )

    async def delete_by_vk_user(self, vk_user_id: int) -> None:
        stmt = delete(PhotoAnalysis).where(PhotoAnalysis.author_vk_id == vk_user_id)
        await self.session.execute(stmt)
        await self.session.commit()

    async def get_summary_by_vk_user(self, vk_user_id: int) -> PhotoAnalysisSummarySchema:
        stmt = select(PhotoAnalysis).where(PhotoAnalysis.author_vk_id == vk_user_id)
        res = await self.session.execute(stmt)
        items = list(res.scalars().all())
        return build_summary_dto(items, len(items))

    async def get_bulk_summaries(self, vk_author_ids: list[int]) -> dict[int, PhotoAnalysisSummarySchema]:
        if not vk_author_ids:
            return {}
        stmt = select(PhotoAnalysis).where(PhotoAnalysis.author_vk_id.in_(vk_author_ids))
        res = await self.session.execute(stmt)
        grouped: dict[int, list[PhotoAnalysis]] = {}
        for analysis in res.scalars().all():
            grouped.setdefault(analysis.author_vk_id, []).append(analysis)
        return {vid: build_summary_dto(items, len(items)) for vid, items in grouped.items() if vid in vk_author_ids}
