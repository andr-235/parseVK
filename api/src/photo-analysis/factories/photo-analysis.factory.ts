import { Injectable } from '@nestjs/common';
import { SuspicionLevel as PrismaSuspicionLevel } from '@prisma/client';
import type { ModerationResult } from '../interfaces/moderation-service.interface';

export interface PhotoAnalysisData {
  authorId: number;
  photoUrl: string;
  photoVkId: string;
  moderationResult: ModerationResult;
}

@Injectable()
export class PhotoAnalysisFactory {
  createAnalysisData(params: {
    authorId: number;
    photoUrl: string;
    photoVkId: string;
    moderationResult: ModerationResult;
  }): PhotoAnalysisData {
    return {
      authorId: params.authorId,
      photoUrl: params.photoUrl,
      photoVkId: params.photoVkId,
      moderationResult: params.moderationResult,
    };
  }

  createSuspicionLevel(
    hasSuspicious: boolean,
    confidence: number | null,
  ): PrismaSuspicionLevel {
    if (!hasSuspicious) {
      return PrismaSuspicionLevel.NONE;
    }

    if (typeof confidence === 'number') {
      if (confidence >= 90) {
        return PrismaSuspicionLevel.HIGH;
      }

      if (confidence >= 70) {
        return PrismaSuspicionLevel.MEDIUM;
      }

      return PrismaSuspicionLevel.LOW;
    }

    return PrismaSuspicionLevel.LOW;
  }

  createCategories(rawCategories: string[]): string[] {
    return Array.from(
      new Set(rawCategories.map((category) => category.trim()).filter(Boolean)),
    );
  }
}
