import logging
from datetime import datetime, timezone
from sqlalchemy import select, delete, and_
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import PhotoAnalysis
from app.modules.photo_analysis.adapter import WebhookModerationAdapter
from app.modules.photo_analysis.clients import (
    VkServiceClient,
    ContentServiceClient,
    ImageModerationWebhookClient,
)
from app.modules.photo_analysis.schemas import (
    AnalyzePhotosSchema,
    PhotoAnalysisItemSchema,
    PhotoAnalysisSummarySchema,
    PhotoAnalysisListSchema,
    PhotoAnalysisSummaryCategorySchema,
    PhotoAnalysisSummaryLevelSchema,
)

logger = logging.getLogger("moderation-service.photo-analysis.service")

KNOWN_CATEGORIES = ['violence', 'drugs', 'weapons', 'nsfw', 'extremism', 'hate speech']


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def get_max_photo_size(sizes: list[dict]) -> str | None:
    if not sizes:
        return None
    priority = ['w', 'z', 'y', 'x', 'm', 's']
    for t in priority:
        for size in sizes:
            if size.get("type") == t and size.get("url"):
                return size["url"]
    return sizes[0].get("url")


# create_suspicion_level has been moved to WebhookModerationAdapter


def build_summary_dto(items: list[PhotoAnalysis], total_count: int) -> PhotoAnalysisSummarySchema:
    categories = {}
    level_order = ['NONE', 'LOW', 'MEDIUM', 'HIGH']
    level_counts = {level: 0 for level in level_order}
    
    last_analyzed_at = None
    suspicious = 0
    
    for item in items:
        level_counts[item.suspicion_level] += 1
        if item.has_suspicious:
            suspicious += 1
            
        if item.analyzed_at:
            if not last_analyzed_at or item.analyzed_at > last_analyzed_at:
                last_analyzed_at = item.analyzed_at
                
        for cat in item.categories or []:
            cleaned = cat.strip().lower()
            if cleaned:
                categories[cleaned] = categories.get(cleaned, 0) + 1
                
    for cat in KNOWN_CATEGORIES:
        if cat not in categories:
            categories[cat] = 0
            
    known_order = {cat: idx for idx, cat in enumerate(KNOWN_CATEGORIES)}
    
    def sort_key(entry):
        name, count = entry
        order = known_order.get(name, 999)
        return (-count, order, name)
        
    sorted_categories = sorted(categories.items(), key=sort_key)
    
    category_list = [
        PhotoAnalysisSummaryCategorySchema(name=name, count=count)
        for name, count in sorted_categories
    ]
    
    levels_list = [
        PhotoAnalysisSummaryLevelSchema(level=level, count=count)
        for level, count in level_counts.items()
    ]
    
    return PhotoAnalysisSummarySchema(
        total=total_count,
        suspicious=suspicious,
        lastAnalyzedAt=last_analyzed_at.isoformat() if last_analyzed_at else None,
        categories=category_list,
        levels=levels_list
    )


def map_item_to_schema(item: PhotoAnalysis) -> PhotoAnalysisItemSchema:
    return PhotoAnalysisItemSchema(
        id=item.id,
        authorId=item.author_vk_id,
        photoUrl=item.photo_url,
        photoVkId=item.photo_vk_id,
        hasSuspicious=item.has_suspicious,
        suspicionLevel=item.suspicion_level,
        categories=item.categories,
        confidence=item.confidence,
        explanation=item.explanation,
        analyzedAt=item.analyzed_at.isoformat() if item.analyzed_at else utcnow().isoformat()
    )


class PhotoAnalysisService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.vk_client = VkServiceClient()
        self.content_client = ContentServiceClient()
        self.webhook_client = ImageModerationWebhookClient()

    async def analyze_by_vk_user(self, vk_user_id: int, options: AnalyzePhotosSchema) -> PhotoAnalysisListSchema:
        logger.info(
            f"Starting photo analysis for vk_user_id={vk_user_id}, limit={options.limit}, force={options.force}"
        )
        
        # Load user photos from vk-service
        photos = await self.vk_client.get_user_photos(vk_user_id, count=options.limit or 100, offset=options.offset)
        
        if not photos:
            logger.info("No photos found for VK user, marking author verified without moderation call")
            await self.content_client.verify_author(vk_user_id)
            return await self.list_by_vk_user(vk_user_id)

        # Prepare photos mapping
        photos_to_process = []
        for photo in photos:
            photo_vk_id = str(photo.get("photo_id") or photo.get("id"))
            url = get_max_photo_size(photo.get("sizes") or [])
            if not url:
                logger.warning(f"Could not resolve photo URL for photo {photo_vk_id}, skipping")
                continue
            photos_to_process.append({
                "photo_vk_id": photo_vk_id,
                "url": url,
                "raw": photo
            })

        # Filter already processed if force is False
        if not options.force and photos_to_process:
            vk_ids = [p["photo_vk_id"] for p in photos_to_process]
            stmt = select(PhotoAnalysis.photo_vk_id).where(
                and_(PhotoAnalysis.author_vk_id == vk_user_id, PhotoAnalysis.photo_vk_id.in_(vk_ids))
            )
            res = await self.session.execute(stmt)
            existing_ids = set(res.scalars().all())
            photos_to_process = [p for p in photos_to_process if p["photo_vk_id"] not in existing_ids]

        if not photos_to_process:
            logger.info("All photos already analyzed, skipping moderation request")
            await self.content_client.verify_author(vk_user_id)
            return await self.list_by_vk_user(vk_user_id)

        # moderate via webhook
        image_urls = [p["url"] for p in photos_to_process]
        moderation_raw_results = await self.webhook_client.moderate_photos(image_urls)

        # Parse and save results
        now = utcnow()
        for idx, p in enumerate(photos_to_process):
            raw = moderation_raw_results[idx] if idx < len(moderation_raw_results) else {}
            adapted = WebhookModerationAdapter.adapt(raw)

            stmt = insert(PhotoAnalysis).values(
                author_vk_id=vk_user_id,
                photo_url=p["url"],
                photo_vk_id=p["photo_vk_id"],
                analysis_result=raw,
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
        await self.content_client.verify_author(vk_user_id)
        return await self.list_by_vk_user(vk_user_id)

    async def list_by_vk_user(self, vk_user_id: int) -> PhotoAnalysisListSchema:
        stmt = select(PhotoAnalysis).where(PhotoAnalysis.author_vk_id == vk_user_id).order_by(PhotoAnalysis.analyzed_at.desc())
        res = await self.session.execute(stmt)
        items = list(res.scalars().all())
        
        schema_items = [map_item_to_schema(i) for i in items]
        summary = build_summary_dto(items, len(items))
        
        return PhotoAnalysisListSchema(
            items=schema_items,
            total=len(items),
            suspiciousCount=summary.suspicious,
            analyzedCount=len(items),
            summary=summary
        )

    async def list_suspicious_by_vk_user(self, vk_user_id: int) -> PhotoAnalysisListSchema:
        stmt = select(PhotoAnalysis).where(
            and_(PhotoAnalysis.author_vk_id == vk_user_id, PhotoAnalysis.has_suspicious == True)
        ).order_by(PhotoAnalysis.analyzed_at.desc())
        res = await self.session.execute(stmt)
        items = list(res.scalars().all())
        
        schema_items = [map_item_to_schema(i) for i in items]
        
        # Получаем общее количество для сводки
        total_stmt = select(PhotoAnalysis).where(PhotoAnalysis.author_vk_id == vk_user_id)
        total_res = await self.session.execute(total_stmt)
        all_items = list(total_res.scalars().all())
        summary = build_summary_dto(all_items, len(all_items))
        
        return PhotoAnalysisListSchema(
            items=schema_items,
            total=len(items),
            suspiciousCount=summary.suspicious,
            analyzedCount=len(all_items),
            summary=summary
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
        all_analyses = list(res.scalars().all())
        
        grouped = {}
        for analysis in all_analyses:
            grouped.setdefault(analysis.author_vk_id, []).append(analysis)
            
        result = {}
        for vk_id in vk_author_ids:
            items = grouped.get(vk_id, [])
            result[vk_id] = build_summary_dto(items, len(items))
            
        return result
