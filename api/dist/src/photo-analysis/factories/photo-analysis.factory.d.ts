import { SuspicionLevel as PrismaSuspicionLevel } from '../../generated/prisma/client.js';
import type { ModerationResult } from '../interfaces/moderation-service.interface.js';
export interface PhotoAnalysisData {
    authorId: number;
    photoUrl: string;
    photoVkId: string;
    moderationResult: ModerationResult;
}
export declare class PhotoAnalysisFactory {
    createAnalysisData(params: {
        authorId: number;
        photoUrl: string;
        photoVkId: string;
        moderationResult: ModerationResult;
    }): PhotoAnalysisData;
    createSuspicionLevel(hasSuspicious: boolean, confidence: number | null): PrismaSuspicionLevel;
    createCategories(rawCategories: string[]): string[];
}
