import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SuspicionLevel as PrismaSuspicionLevel } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { VkService } from '../vk/vk.service';
import { OllamaService } from '../ollama/ollama.service';
import type { AnalyzePhotosDto } from './dto/analyze-photos.dto';
import type {
  PhotoAnalysisItemDto,
  PhotoAnalysisListDto,
  PhotoAnalysisSummaryDto,
  PhotoSuspicionLevel,
} from './dto/photo-analysis-response.dto';
import type { OllamaAnalysisResponse } from '../ollama/interfaces/analysis.interface';

const MAX_PHOTO_LIMIT = 200;
const KNOWN_CATEGORIES = ['violence', 'drugs', 'weapons', 'nsfw', 'extremism', 'hate speech'] as const;

@Injectable()
export class PhotoAnalysisService {
  private readonly logger = new Logger(PhotoAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vkService: VkService,
    private readonly ollamaService: OllamaService,
  ) {}

  async analyzeByVkUser(
    vkUserId: number,
    options?: AnalyzePhotosDto,
  ): Promise<PhotoAnalysisListDto> {
    const startTime = Date.now();
    const { limit = 50, force = false } = options ?? {};
    const normalizedLimit = Math.min(Math.max(limit, 1), MAX_PHOTO_LIMIT);

    this.logger.log(
      `Начало анализа фото для пользователя vkUserId=${vkUserId}, limit=${normalizedLimit}, force=${force}`,
    );

    const author = await this.findAuthorOrThrow(vkUserId);

    const photos = await this.vkService.getUserPhotos({
      userId: author.vkUserId,
      count: normalizedLimit,
    });

    this.logger.log(
      `Получено ${photos.length} фото автора ${author.id} (vkUserId=${author.vkUserId}) для анализа`,
    );

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let noUrlCount = 0;

    for (const photo of photos) {
      const photoUrl = this.vkService.getMaxPhotoSize(photo.sizes);

      if (!photoUrl) {
        this.logger.warn(`Не найден URL изображения для фото ${photo.photo_id}`);
        noUrlCount++;
        continue;
      }

      if (!force) {
        const existing = await this.prisma.photoAnalysis.findUnique({
          where: {
            authorId_photoVkId: {
              authorId: author.id,
              photoVkId: photo.photo_id,
            },
          },
        });

        if (existing) {
          this.logger.debug(`Фото ${photo.photo_id} уже проанализировано, пропускаем`);
          skippedCount++;
          continue;
        }
      }

      try {
        const analysis = await this.ollamaService.analyzeImage({
          imageUrl: photoUrl,
        });

        await this.saveAnalysis({
          authorId: author.id,
          photoId: photo.photo_id,
          photoUrl,
          analysis,
        });

        successCount++;
        this.logger.log(
          `Фото ${photo.photo_id} проанализировано успешно (${successCount}/${photos.length - skippedCount - noUrlCount}), уровень: ${analysis.suspicionLevel}`,
        );
      } catch (error) {
        errorCount++;
        this.logger.error(
          `Ошибка анализа фото ${photo.photo_id} (${errorCount} ошибок)`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    const totalElapsed = Date.now() - startTime;
    const totalElapsedSec = (totalElapsed / 1000).toFixed(2);

    this.logger.log(
      `Анализ фото завершен за ${totalElapsedSec}s. ` +
      `Статистика: успешно=${successCount}, ошибок=${errorCount}, пропущено=${skippedCount}, без URL=${noUrlCount}, всего фото=${photos.length}`,
    );

    return this.listByVkUser(vkUserId);
  }

  async listByVkUser(vkUserId: number): Promise<PhotoAnalysisListDto> {
    const author = await this.findAuthorOrThrow(vkUserId);
    const analyses = await this.prisma.photoAnalysis.findMany({
      where: { authorId: author.id },
      orderBy: { analyzedAt: 'desc' },
    });

    const items = analyses.map((analysis) => this.mapPhotoAnalysis(analysis));
    const summary = this.buildSummary(items);

    return {
      items,
      total: items.length,
      suspiciousCount: summary.suspicious,
      analyzedCount: items.length,
      summary,
    };
  }

  async listSuspiciousByVkUser(vkUserId: number): Promise<PhotoAnalysisListDto> {
    const author = await this.findAuthorOrThrow(vkUserId);
    const analyses = await this.prisma.photoAnalysis.findMany({
      where: {
        authorId: author.id,
        hasSuspicious: true,
      },
      orderBy: { suspicionLevel: 'desc' },
    });

    const items = analyses.map((analysis) => this.mapPhotoAnalysis(analysis));
    const summary = this.buildSummary(items);

    return {
      items,
      total: items.length,
      suspiciousCount: summary.suspicious,
      analyzedCount: items.length,
      summary,
    };
  }

  async deleteByVkUser(vkUserId: number): Promise<void> {
    const author = await this.findAuthorOrThrow(vkUserId);
    await this.prisma.photoAnalysis.deleteMany({ where: { authorId: author.id } });
  }

  async getSummaryByVkUser(vkUserId: number): Promise<PhotoAnalysisSummaryDto> {
    const { items } = await this.listByVkUser(vkUserId);
    return this.buildSummary(items);
  }

  async getSummariesByAuthorIds(
    authorIds: number[],
  ): Promise<Map<number, PhotoAnalysisSummaryDto>> {
    if (!authorIds.length) {
      return new Map();
    }

    const analyses = await this.prisma.photoAnalysis.findMany({
      where: {
        authorId: { in: authorIds },
      },
    });

    const grouped = new Map<number, PhotoAnalysisItemDto[]>();

    analyses.forEach((analysis) => {
      const item = this.mapPhotoAnalysis(analysis);
      const list = grouped.get(analysis.authorId) ?? [];
      list.push(item);
      grouped.set(analysis.authorId, list);
    });

    const summaryMap = new Map<number, PhotoAnalysisSummaryDto>();

    authorIds.forEach((authorId) => {
      const items = grouped.get(authorId) ?? [];
      summaryMap.set(authorId, this.buildSummary(items));
    });

    return summaryMap;
  }

  getEmptySummary(): PhotoAnalysisSummaryDto {
    return this.buildSummary([]);
  }

  private async findAuthorOrThrow(vkUserId: number) {
    const author = await this.prisma.author.findUnique({
      where: { vkUserId },
    });

    if (!author) {
      throw new NotFoundException(`Автор с vkUserId=${vkUserId} не найден`);
    }

    return author;
  }

  private async saveAnalysis(params: {
    authorId: number;
    photoId: string;
    photoUrl: string;
    analysis: OllamaAnalysisResponse;
  }): Promise<void> {
    const suspicionLevel = this.mapSuspicionLevel(params.analysis.suspicionLevel);
    const categories = (params.analysis.categories ?? [])
      .map((category) => category.trim())
      .filter((category) => category.length > 0);

    await this.prisma.photoAnalysis.upsert({
      where: {
        authorId_photoVkId: {
          authorId: params.authorId,
          photoVkId: params.photoId,
        },
      },
      update: {
        photoUrl: params.photoUrl,
        analysisResult: JSON.stringify(params.analysis),
        hasSuspicious: Boolean(params.analysis.hasSuspicious),
        suspicionLevel,
        categories,
        confidence: typeof params.analysis.confidence === 'number'
          ? params.analysis.confidence
          : null,
        explanation: params.analysis.explanation ?? null,
        analyzedAt: new Date(),
      },
      create: {
        authorId: params.authorId,
        photoUrl: params.photoUrl,
        photoVkId: params.photoId,
        analysisResult: JSON.stringify(params.analysis),
        hasSuspicious: Boolean(params.analysis.hasSuspicious),
        suspicionLevel,
        categories,
        confidence: typeof params.analysis.confidence === 'number'
          ? params.analysis.confidence
          : null,
        explanation: params.analysis.explanation ?? null,
      },
    });
  }

  private mapPhotoAnalysis(analysis: {
    id: number;
    authorId: number;
    photoUrl: string;
    photoVkId: string;
    hasSuspicious: boolean;
    suspicionLevel: PrismaSuspicionLevel;
    categories: string[];
    confidence: number | null;
    explanation: string | null;
    analyzedAt: Date;
  }): PhotoAnalysisItemDto {
    return {
      id: analysis.id,
      authorId: analysis.authorId,
      photoUrl: analysis.photoUrl,
      photoVkId: analysis.photoVkId,
      hasSuspicious: analysis.hasSuspicious,
      suspicionLevel: analysis.suspicionLevel as PhotoSuspicionLevel,
      categories: analysis.categories ?? [],
      confidence: typeof analysis.confidence === 'number' ? analysis.confidence : null,
      explanation: analysis.explanation,
      analyzedAt: analysis.analyzedAt.toISOString(),
    };
  }

  private mapSuspicionLevel(level: string | undefined): PrismaSuspicionLevel {
    const normalized = (level ?? 'NONE').toUpperCase() as keyof typeof PrismaSuspicionLevel;

    if (Object.prototype.hasOwnProperty.call(PrismaSuspicionLevel, normalized)) {
      return PrismaSuspicionLevel[normalized];
    }

    return PrismaSuspicionLevel.NONE;
  }

  private buildSummary(items: PhotoAnalysisItemDto[]): PhotoAnalysisSummaryDto {
    const categories = new Map<string, number>();
    const levelOrder: PhotoSuspicionLevel[] = ['NONE', 'LOW', 'MEDIUM', 'HIGH'];
    const levelCounts = new Map<PhotoSuspicionLevel, number>(
      levelOrder.map((level) => [level, 0] as [PhotoSuspicionLevel, number]),
    );

    let lastAnalyzedAt: string | null = null;
    let suspicious = 0;

    for (const item of items) {
      levelCounts.set(
        item.suspicionLevel,
        (levelCounts.get(item.suspicionLevel) ?? 0) + 1,
      );

      if (item.hasSuspicious) {
        suspicious += 1;
      }

      if (!lastAnalyzedAt || new Date(item.analyzedAt) > new Date(lastAnalyzedAt)) {
        lastAnalyzedAt = item.analyzedAt;
      }

      for (const rawCategory of item.categories ?? []) {
        const key = rawCategory.trim().toLowerCase();

        if (!key) {
          continue;
        }

        categories.set(key, (categories.get(key) ?? 0) + 1);
      }
    }

    const knownOrder = new Map<string, number>(
      KNOWN_CATEGORIES.map((category, index) => [category, index]),
    );

    for (const category of KNOWN_CATEGORIES) {
      if (!categories.has(category)) {
        categories.set(category, 0);
      }
    }

    const categoryList = Array.from(categories.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (a.count !== b.count) {
          return b.count - a.count;
        }

        const aOrder = knownOrder.get(a.name) ?? Number.POSITIVE_INFINITY;
        const bOrder = knownOrder.get(b.name) ?? Number.POSITIVE_INFINITY;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        return a.name.localeCompare(b.name);
      });

    return {
      total: items.length,
      suspicious,
      lastAnalyzedAt,
      categories: categoryList,
      levels: levelOrder.map((level) => ({
        level,
        count: levelCounts.get(level) ?? 0,
      })),
    };
  }
}
