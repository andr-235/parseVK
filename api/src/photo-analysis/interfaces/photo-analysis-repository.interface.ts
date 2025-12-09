import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import type {
  PhotoAnalysisItemDto,
  PhotoSuspicionLevel,
} from '../dto/photo-analysis-response.dto';

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

@Injectable()
export class PhotoAnalysisRepository implements IPhotoAnalysisRepository {
  private readonly logger = new Logger(PhotoAnalysisRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByAuthorId(authorId: number): Promise<PhotoAnalysisItemDto[]> {
    const analyses: Array<{
      id: number;
      authorId: number;
      photoUrl: string;
      photoVkId: string;
      hasSuspicious: boolean;
      suspicionLevel: string;
      categories: unknown;
      confidence: unknown;
      explanation: string | null;
      analyzedAt: Date;
    }> = await this.prisma.photoAnalysis.findMany({
      where: { authorId },
      orderBy: { analyzedAt: 'desc' },
    });

    return analyses.map((analysis) => ({
      id: analysis.id,
      authorId: analysis.authorId,
      photoUrl: analysis.photoUrl,
      photoVkId: analysis.photoVkId,
      hasSuspicious: analysis.hasSuspicious,
      suspicionLevel: analysis.suspicionLevel as PhotoSuspicionLevel,
      categories: analysis.categories ?? [],
      confidence:
        typeof analysis.confidence === 'number' ? analysis.confidence : null,
      explanation: analysis.explanation,
      analyzedAt: analysis.analyzedAt.toISOString(),
    }));
  }

  async findSuspiciousByAuthorId(
    authorId: number,
  ): Promise<PhotoAnalysisItemDto[]> {
    const analyses: Array<{
      id: number;
      authorId: number;
      photoUrl: string;
      photoVkId: string;
      hasSuspicious: boolean;
      suspicionLevel: string;
      categories: unknown;
      confidence: unknown;
      explanation: string | null;
      analyzedAt: Date;
    }> = await this.prisma.photoAnalysis.findMany({
      where: {
        authorId,
        hasSuspicious: true,
      },
      orderBy: { suspicionLevel: 'desc' },
    });

    return analyses.map((analysis) => ({
      id: analysis.id,
      authorId: analysis.authorId,
      photoUrl: analysis.photoUrl,
      photoVkId: analysis.photoVkId,
      hasSuspicious: analysis.hasSuspicious,
      suspicionLevel: analysis.suspicionLevel as PhotoSuspicionLevel,
      categories: analysis.categories ?? [],
      confidence:
        typeof analysis.confidence === 'number' ? analysis.confidence : null,
      explanation: analysis.explanation,
      analyzedAt: analysis.analyzedAt.toISOString(),
    }));
  }

  async saveAnalysis(params: {
    authorId: number;
    photoUrl: string;
    photoVkId: string;
    hasSuspicious: boolean;
    suspicionLevel: string;
    categories: string[];
    confidence: number | null;
    explanation: string | null;
    rawResponse: unknown;
  }): Promise<void> {
    await this.prisma.photoAnalysis.upsert({
      where: {
        authorId_photoVkId: {
          authorId: params.authorId,
          photoVkId: params.photoVkId,
        },
      },
      update: {
        photoUrl: params.photoUrl,
        analysisResult: JSON.stringify(params.rawResponse ?? null),
        hasSuspicious: params.hasSuspicious,
        suspicionLevel: params.suspicionLevel as PhotoSuspicionLevel,
        categories: params.categories,
        confidence: params.confidence,
        explanation: params.explanation,
        analyzedAt: new Date(),
      },
      create: {
        authorId: params.authorId,
        photoUrl: params.photoUrl,
        photoVkId: params.photoVkId,
        analysisResult: JSON.stringify(params.rawResponse ?? null),
        hasSuspicious: params.hasSuspicious,
        suspicionLevel: params.suspicionLevel as PhotoSuspicionLevel,
        categories: params.categories,
        confidence: params.confidence,
        explanation: params.explanation,
      },
    });
  }

  async deleteByAuthorId(authorId: number): Promise<void> {
    await this.prisma.photoAnalysis.deleteMany({
      where: { authorId },
    });
  }

  async findExistingAnalyses(
    authorId: number,
    photoVkIds: string[],
  ): Promise<string[]> {
    const existing = await this.prisma.photoAnalysis.findMany({
      where: {
        authorId,
        photoVkId: { in: photoVkIds },
      },
      select: { photoVkId: true },
    });

    return existing.map((item) => item.photoVkId);
  }

  async findByAuthorIds(authorIds: number[]): Promise<PhotoAnalysisItemDto[]> {
    if (!authorIds.length) {
      return [];
    }

    const analyses: Array<{
      id: number;
      authorId: number;
      photoUrl: string;
      photoVkId: string;
      hasSuspicious: boolean;
      suspicionLevel: string;
      categories: unknown;
      confidence: unknown;
      explanation: string | null;
      analyzedAt: Date;
    }> = await this.prisma.photoAnalysis.findMany({
      where: {
        authorId: { in: authorIds },
      },
    });

    return analyses.map((analysis) => ({
      id: analysis.id,
      authorId: analysis.authorId,
      photoUrl: analysis.photoUrl,
      photoVkId: analysis.photoVkId,
      hasSuspicious: analysis.hasSuspicious,
      suspicionLevel: analysis.suspicionLevel as PhotoSuspicionLevel,
      categories: analysis.categories ?? [],
      confidence:
        typeof analysis.confidence === 'number' ? analysis.confidence : null,
      explanation: analysis.explanation,
      analyzedAt: analysis.analyzedAt.toISOString(),
    }));
  }

  async markAuthorVerified(authorId: number): Promise<void> {
    try {
      await this.prisma.author.update({
        where: { id: authorId },
        data: { verifiedAt: new Date() },
      });
    } catch (error) {
      // Логирование ошибки, но не прерываем выполнение
      this.logger.warn(
        `Не удалось обновить дату проверки автора ${authorId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
