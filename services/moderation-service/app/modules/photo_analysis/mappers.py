from datetime import UTC, datetime

from app.db.models import PhotoAnalysis
from app.modules.photo_analysis.schemas import (
    PhotoAnalysisItemSchema,
    PhotoAnalysisSummaryCategorySchema,
    PhotoAnalysisSummaryLevelSchema,
    PhotoAnalysisSummarySchema,
)


def utcnow() -> datetime:
    return datetime.now(UTC)


def map_item_to_schema(item: PhotoAnalysis) -> PhotoAnalysisItemSchema:
    analyzed_at = item.analyzed_at.isoformat() if item.analyzed_at else utcnow().isoformat()
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
        analyzedAt=analyzed_at,
    )


def build_summary_dto(items: list[PhotoAnalysis], total_count: int) -> PhotoAnalysisSummarySchema:
    suspicious = sum(1 for i in items if i.has_suspicious)

    category_counts: dict[str, int] = {}
    level_counts: dict[str, int] = {}
    last_analyzed: str | None = None

    for item in items:
        for cat in item.categories:
            category_counts[cat] = category_counts.get(cat, 0) + 1

        level_counts[item.suspicion_level] = level_counts.get(item.suspicion_level, 0) + 1

        if item.analyzed_at:
            item_iso = item.analyzed_at.isoformat()
            if last_analyzed is None or item_iso > last_analyzed:
                last_analyzed = item_iso

    categories = [
        PhotoAnalysisSummaryCategorySchema(name=name, count=count)
        for name, count in sorted(category_counts.items(), key=lambda x: -x[1])
    ]

    levels = [
        PhotoAnalysisSummaryLevelSchema(level=level, count=count)
        for level, count in sorted(level_counts.items(), key=lambda x: -x[1])
    ]

    return PhotoAnalysisSummarySchema(
        total=total_count,
        suspicious=suspicious,
        lastAnalyzedAt=last_analyzed,
        categories=categories,
        levels=levels,
    )
