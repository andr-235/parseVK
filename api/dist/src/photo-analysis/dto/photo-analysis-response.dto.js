export class PhotoAnalysisItemDto {
    id;
    authorId;
    photoUrl;
    photoVkId;
    hasSuspicious;
    suspicionLevel;
    categories;
    confidence;
    explanation;
    analyzedAt;
}
export class PhotoAnalysisSummaryDto {
    total;
    suspicious;
    lastAnalyzedAt;
    categories;
    levels;
}
export class PhotoAnalysisListDto {
    items;
    total;
    suspiciousCount;
    analyzedCount;
    summary;
}
//# sourceMappingURL=photo-analysis-response.dto.js.map