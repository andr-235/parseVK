import { PrismaService } from '../../prisma.service.js';
import type { IPhotoAnalysisAuthorRepository, PhotoAnalysisAuthorRecord } from '../interfaces/photo-analysis-author-repository.interface.js';
export declare class PhotoAnalysisAuthorRepository implements IPhotoAnalysisAuthorRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByVkId(vkUserId: number): Promise<PhotoAnalysisAuthorRecord | null>;
}
