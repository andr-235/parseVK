export type PhotoSuspicionLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export class PhotoAnalysisItemDto {
  id!: number;
  authorId!: number;
  photoUrl!: string;
  photoVkId!: string;
  hasSuspicious!: boolean;
  suspicionLevel!: PhotoSuspicionLevel;
  categories!: string[];
  confidence!: number | null;
  explanation!: string | null;
  analyzedAt!: string;
}

export interface PhotoAnalysisSummaryCategoryDto {
  name: string;
  count: number;
}

export interface PhotoAnalysisSummaryLevelDto {
  level: PhotoSuspicionLevel;
  count: number;
}

export class PhotoAnalysisSummaryDto {
  total!: number;
  suspicious!: number;
  lastAnalyzedAt!: string | null;
  categories!: PhotoAnalysisSummaryCategoryDto[];
  levels!: PhotoAnalysisSummaryLevelDto[];
}

export class PhotoAnalysisListDto {
  items!: PhotoAnalysisItemDto[];
  total!: number;
  suspiciousCount!: number;
  analyzedCount!: number;
  summary!: PhotoAnalysisSummaryDto;
}
