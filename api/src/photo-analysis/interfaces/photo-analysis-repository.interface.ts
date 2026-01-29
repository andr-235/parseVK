import type { PhotoAnalysisItemDto } from '../dto/photo-analysis-response.dto.js';

export interface IPhotoAnalysisRepository {
  findByAuthorId(authorId: number): Promise<PhotoAnalysisItemDto[]>;
  findSuspiciousByAuthorId(authorId: number): Promise<PhotoAnalysisItemDto[]>;
  findByAuthorIds(authorIds: number[]): Promise<PhotoAnalysisItemDto[]>;
  saveAnalysis(params: {
    authorId: number;
    photoUrl: string;
    photoVkId: string;
    hasSuspicious: boolean;
    suspicionLevel: string;
    categories: string[];
    confidence: number | null;
    explanation: string | null;
    rawResponse: unknown;
  }): Promise<void>;
  deleteByAuthorId(authorId: number): Promise<void>;
  findExistingAnalyses(
    authorId: number,
    photoVkIds: string[],
  ): Promise<string[]>;
  markAuthorVerified(authorId: number): Promise<void>;
}
