from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class AnalyzePhotosSchema(BaseModel):
    limit: int | None = Field(default=None, ge=1, le=200)
    force: bool = False
    offset: int = Field(default=0, ge=0)


class PhotoAnalysisItemSchema(BaseModel):
    id: int
    authorId: int = Field(..., serialization_alias="authorId")
    photoUrl: str = Field(..., serialization_alias="photoUrl")
    photoVkId: str = Field(..., serialization_alias="photoVkId")
    hasSuspicious: bool = Field(..., serialization_alias="hasSuspicious")
    suspicionLevel: str = Field(..., serialization_alias="suspicionLevel")
    categories: list[str]
    confidence: float | None
    explanation: str | None
    analyzedAt: str = Field(..., serialization_alias="analyzedAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        by_alias=True
    )


class PhotoAnalysisSummaryCategorySchema(BaseModel):
    name: str
    count: int


class PhotoAnalysisSummaryLevelSchema(BaseModel):
    level: str
    count: int


class PhotoAnalysisSummarySchema(BaseModel):
    total: int
    suspicious: int
    lastAnalyzedAt: str | None = Field(..., serialization_alias="lastAnalyzedAt")
    categories: list[PhotoAnalysisSummaryCategorySchema]
    levels: list[PhotoAnalysisSummaryLevelSchema]

    model_config = ConfigDict(
        populate_by_name=True,
        by_alias=True
    )


class PhotoAnalysisListSchema(BaseModel):
    items: list[PhotoAnalysisItemSchema]
    total: int
    suspiciousCount: int = Field(..., serialization_alias="suspiciousCount")
    analyzedCount: int = Field(..., serialization_alias="analyzedCount")
    summary: PhotoAnalysisSummarySchema

    model_config = ConfigDict(
        populate_by_name=True,
        by_alias=True
    )


class BulkSummariesRequestSchema(BaseModel):
    vk_author_ids: list[int]
