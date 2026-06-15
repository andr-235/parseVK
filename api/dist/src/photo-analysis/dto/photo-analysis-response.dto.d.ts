export type PhotoSuspicionLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
export declare class PhotoAnalysisItemDto {
    id: number;
    authorId: number;
    photoUrl: string;
    photoVkId: string;
    hasSuspicious: boolean;
    suspicionLevel: PhotoSuspicionLevel;
    categories: string[];
    confidence: number | null;
    explanation: string | null;
    analyzedAt: string;
}
export interface PhotoAnalysisSummaryCategoryDto {
    name: string;
    count: number;
}
export interface PhotoAnalysisSummaryLevelDto {
    level: PhotoSuspicionLevel;
    count: number;
}
export declare class PhotoAnalysisSummaryDto {
    total: number;
    suspicious: number;
    lastAnalyzedAt: string | null;
    categories: PhotoAnalysisSummaryCategoryDto[];
    levels: PhotoAnalysisSummaryLevelDto[];
}
export declare class PhotoAnalysisListDto {
    items: PhotoAnalysisItemDto[];
    total: number;
    suspiciousCount: number;
    analyzedCount: number;
    summary: PhotoAnalysisSummaryDto;
}
