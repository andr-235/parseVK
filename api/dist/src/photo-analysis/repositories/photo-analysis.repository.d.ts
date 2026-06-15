import { PrismaService } from '../../prisma.service.js';
import type { PhotoAnalysisItemDto } from '../dto/photo-analysis-response.dto.js';
import type { IPhotoAnalysisRepository } from '../interfaces/photo-analysis-repository.interface.js';
export declare class PhotoAnalysisRepository implements IPhotoAnalysisRepository {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findByAuthorId(authorId: number): Promise<PhotoAnalysisItemDto[]>;
    findSuspiciousByAuthorId(authorId: number): Promise<PhotoAnalysisItemDto[]>;
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
    findExistingAnalyses(authorId: number, photoVkIds: string[]): Promise<string[]>;
    findByAuthorIds(authorIds: number[]): Promise<PhotoAnalysisItemDto[]>;
    markAuthorVerified(authorId: number): Promise<void>;
    private normalizeCategories;
}
