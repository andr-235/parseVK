import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SuspicionLevel as PrismaSuspicionLevel } from '@prisma/client';
import { request as httpRequest } from 'node:http';
import {
  request as httpsRequest,
  type RequestOptions as HttpsRequestOptions,
} from 'node:https';
import { PrismaService } from '../prisma.service';
import { VkService } from '../vk/vk.service';
import type { VkPhoto } from '../vk/vk.service';
import type { AnalyzePhotosDto } from './dto/analyze-photos.dto';
import type {
  PhotoAnalysisItemDto,
  PhotoAnalysisListDto,
  PhotoAnalysisSummaryDto,
  PhotoSuspicionLevel,
} from './dto/photo-analysis-response.dto';

const MAX_PHOTO_LIMIT = 200;
const DEFAULT_IMAGE_MODERATION_WEBHOOK_URL =
  'https://192.168.88.12/webhook/image-moderation';
const KNOWN_CATEGORIES = [
  'violence',
  'drugs',
  'weapons',
  'nsfw',
  'extremism',
  'hate speech',
] as const;

interface PhotoForModeration {
  photoVkId: string;
  url: string;
}

interface ModerationResult {
  photoVkId: string;
  photoUrl: string;
  hasSuspicious: boolean;
  categories: string[];
  explanation: string | null;
  confidence: number | null;
  rawResponse: unknown;
}

@Injectable()
export class PhotoAnalysisService {
  private readonly logger = new Logger(PhotoAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vkService: VkService,
  ) {}

  async analyzeByVkUser(
    vkUserId: number,
    options?: AnalyzePhotosDto,
  ): Promise<PhotoAnalysisListDto> {
    const startTime = Date.now();
    const { limit, force = false, offset = 0 } = options ?? {};
    const normalizedLimit =
      typeof limit === 'number'
        ? Math.min(Math.max(limit, 1), MAX_PHOTO_LIMIT)
        : null;
    const normalizedOffset = Math.max(offset, 0);

    this.logger.log(
      `Начало анализа фото для пользователя vkUserId=${vkUserId}, limit=${normalizedLimit ?? 'all'}, offset=${normalizedOffset}, force=${force}`,
    );

    const author = await this.findAuthorOrThrow(vkUserId);

    const photos = await this.loadAllUserPhotos({
      userId: author.vkUserId,
      offset: normalizedOffset,
      limit: normalizedLimit ?? undefined,
    });

    this.logger.log(
      `Получено ${photos.length} фото автора ${author.id} (vkUserId=${author.vkUserId}) для анализа`,
    );

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let noUrlCount = 0;

    const photosForModeration: PhotoForModeration[] = [];

    for (const photo of photos) {
      const photoUrl = this.vkService.getMaxPhotoSize(photo.sizes);

      if (!photoUrl) {
        this.logger.warn(
          `Не найден URL изображения для фото ${photo.photo_id}`,
        );
        noUrlCount++;
        continue;
      }

      photosForModeration.push({
        photoVkId: String(photo.photo_id),
        url: photoUrl,
      });
    }

    let photosToAnalyze = photosForModeration;

    if (!force && photosForModeration.length > 0) {
      const existing = await this.prisma.photoAnalysis.findMany({
        where: {
          authorId: author.id,
          photoVkId: { in: photosForModeration.map((item) => item.photoVkId) },
        },
        select: { photoVkId: true },
      });

      const processed = new Set(existing.map((item) => item.photoVkId));
      photosToAnalyze = photosForModeration.filter((item) => {
        const alreadyProcessed = processed.has(item.photoVkId);

        if (alreadyProcessed) {
          skippedCount++;
        }

        return !alreadyProcessed;
      });
    }

    if (!photosToAnalyze.length) {
      this.logger.log(
        'Нет новых фото для анализа — запрос к модерации не выполнялся',
      );

      const totalElapsedEmpty = Date.now() - startTime;
      const totalElapsedEmptySec = (totalElapsedEmpty / 1000).toFixed(2);
      this.logger.log(
        `Анализ фото завершен за ${totalElapsedEmptySec}s. Статистика: успешно=${successCount}, ошибок=${errorCount}, пропущено=${skippedCount}, без URL=${noUrlCount}, всего фото=${photos.length}`,
      );

      await this.markAuthorVerified(author.id);
      return this.listByVkUser(vkUserId);
    }

    let moderationResults: unknown[] = [];
    let moderationRequestFailed = false;

    try {
      moderationResults = await this.requestModeration(
        photosToAnalyze.map((item) => item.url),
      );
    } catch (error) {
      moderationRequestFailed = true;
      errorCount += photosToAnalyze.length;
      this.logger.error(
        `Не удалось получить ответ модерации для пользователя ${author.id} (vkUserId=${author.vkUserId})`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    if (!moderationRequestFailed) {
      if (moderationResults.length !== photosToAnalyze.length) {
        this.logger.warn(
          `Количество результатов модерации (${moderationResults.length}) не совпадает с количеством запросов (${photosToAnalyze.length})`,
        );
      }

      for (let index = 0; index < photosToAnalyze.length; index += 1) {
        const photoInfo = photosToAnalyze[index];
        const raw = moderationResults[index];

        if (raw === undefined) {
          errorCount++;
          this.logger.warn(
            `Отсутствует результат модерации для фото ${photoInfo.photoVkId}`,
          );
          continue;
        }

        try {
          const moderation = this.mapModerationResult(photoInfo, raw);
          const suspicionLevel = await this.saveAnalysis({
            authorId: author.id,
            result: moderation,
          });

          successCount++;
          const totalProcessed = successCount + errorCount;
          this.logger.log(
            `Фото ${photoInfo.photoVkId} проанализировано успешно (${totalProcessed}/${photosToAnalyze.length}), уровень: ${suspicionLevel}`,
          );
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Ошибка анализа фото ${photoInfo.photoVkId} (${errorCount} ошибок)`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }
    }

    const totalElapsed = Date.now() - startTime;
    const totalElapsedSec = (totalElapsed / 1000).toFixed(2);

    this.logger.log(
      `Анализ фото завершен за ${totalElapsedSec}s. ` +
        `Статистика: успешно=${successCount}, ошибок=${errorCount}, пропущено=${skippedCount}, без URL=${noUrlCount}, всего фото=${photos.length}`,
    );

    await this.markAuthorVerified(author.id);
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

  async listSuspiciousByVkUser(
    vkUserId: number,
  ): Promise<PhotoAnalysisListDto> {
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
    await this.prisma.photoAnalysis.deleteMany({
      where: { authorId: author.id },
    });
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

  private async markAuthorVerified(authorId: number): Promise<void> {
    try {
      await this.prisma.author.update({
        where: { id: authorId },
        data: { verifiedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(
        `Не удалось обновить дату проверки автора ${authorId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async saveAnalysis(params: {
    authorId: number;
    result: ModerationResult;
  }): Promise<PrismaSuspicionLevel> {
    const suspicionLevel = this.determineSuspicionLevel(
      params.result.hasSuspicious,
      params.result.confidence,
    );
    const categories = Array.from(
      new Set(
        params.result.categories
          .map((category) => category.trim())
          .filter(Boolean),
      ),
    );

    await this.prisma.photoAnalysis.upsert({
      where: {
        authorId_photoVkId: {
          authorId: params.authorId,
          photoVkId: params.result.photoVkId,
        },
      },
      update: {
        photoUrl: params.result.photoUrl,
        analysisResult: JSON.stringify(params.result.rawResponse ?? null),
        hasSuspicious: params.result.hasSuspicious,
        suspicionLevel,
        categories,
        confidence:
          typeof params.result.confidence === 'number'
            ? params.result.confidence
            : null,
        explanation: params.result.explanation,
        analyzedAt: new Date(),
      },
      create: {
        authorId: params.authorId,
        photoUrl: params.result.photoUrl,
        photoVkId: params.result.photoVkId,
        analysisResult: JSON.stringify(params.result.rawResponse ?? null),
        hasSuspicious: params.result.hasSuspicious,
        suspicionLevel,
        categories,
        confidence:
          typeof params.result.confidence === 'number'
            ? params.result.confidence
            : null,
        explanation: params.result.explanation,
      },
    });

    return suspicionLevel;
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
      confidence:
        typeof analysis.confidence === 'number' ? analysis.confidence : null,
      explanation: analysis.explanation,
      analyzedAt: analysis.analyzedAt.toISOString(),
    };
  }

  private async loadAllUserPhotos(params: {
    userId: number;
    offset?: number;
    limit?: number;
  }): Promise<VkPhoto[]> {
    const { userId, offset = 0, limit } = params;
    const photos: VkPhoto[] = [];
    const batchSize = MAX_PHOTO_LIMIT;
    let currentOffset = Math.max(offset, 0);

    while (!limit || photos.length < limit) {
      const remaining = limit
        ? Math.min(limit - photos.length, batchSize)
        : batchSize;

      if (remaining <= 0) {
        break;
      }

      const chunk = await this.vkService.getUserPhotos({
        userId,
        count: remaining,
        offset: currentOffset,
      });

      if (!chunk.length) {
        break;
      }

      photos.push(...chunk);
      currentOffset += chunk.length;

      if (chunk.length < remaining) {
        break;
      }
    }

    return photos;
  }

  private async requestModeration(imageUrls: string[]): Promise<unknown[]> {
    const webhookUrl =
      process.env.IMAGE_MODERATION_WEBHOOK_URL ??
      DEFAULT_IMAGE_MODERATION_WEBHOOK_URL;
    const allowSelfSignedEnv = process.env.IMAGE_MODERATION_ALLOW_SELF_SIGNED;
    const allowSelfSigned =
      typeof allowSelfSignedEnv === 'string'
        ? allowSelfSignedEnv.toLowerCase() === 'true'
        : webhookUrl === DEFAULT_IMAGE_MODERATION_WEBHOOK_URL;

    const payload = JSON.stringify({ imageUrls });

    const rawResponse = await this.sendModerationRequest({
      url: webhookUrl,
      payload,
      allowSelfSigned,
      imageCount: imageUrls.length,
    });

    let data: unknown;

    try {
      data = rawResponse.length ? JSON.parse(rawResponse) : null;
    } catch (error) {
      throw new Error('Сервис модерации вернул некорректный JSON');
    }

    if (
      !data ||
      typeof data !== 'object' ||
      !Array.isArray((data as { results?: unknown[] }).results)
    ) {
      throw new Error('Ответ сервиса модерации не содержит массива results');
    }

    return ((data as { results?: unknown[] }).results as unknown[]) ?? [];
  }

  private async sendModerationRequest(params: {
    url: string;
    payload: string;
    allowSelfSigned: boolean;
    imageCount: number;
  }): Promise<string> {
    const targetUrl = new URL(params.url);
    const isHttps = targetUrl.protocol === 'https:';
    const requestFn = isHttps ? httpsRequest : httpRequest;
    const timeoutMs = this.resolveModerationTimeout(params.imageCount);
    const timeoutLabel = timeoutMs === 0 ? 'без ограничения' : `${timeoutMs}мс`;

    this.logger.debug(
      `Запрос к модерации: изображений=${params.imageCount}, таймаут=${timeoutLabel}, url=${targetUrl.origin}`,
    );

    const options: HttpsRequestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(Buffer.byteLength(params.payload)),
      },
    };

    if (isHttps && params.allowSelfSigned) {
      options.rejectUnauthorized = false;
    }

    return new Promise<string>((resolve, reject) => {
      const request = requestFn(targetUrl, options, (response) => {
        let responseBody = '';

        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          responseBody += chunk;
        });
        response.on('end', () => {
          const statusCode = response.statusCode ?? 0;
          const statusMessage = response.statusMessage ?? '';

          if (statusCode < 200 || statusCode >= 300) {
            reject(
              new Error(
                `Сервис модерации вернул статус ${statusCode}: ${statusMessage || 'Неизвестная ошибка'}`,
              ),
            );
            return;
          }

          resolve(responseBody);
        });
        response.on('error', (error) => {
          reject(
            new Error(
              `Ошибка чтения ответа сервиса модерации: ${error instanceof Error ? error.message : String(error)}`,
            ),
          );
        });
      });

      request.on('error', (error) => {
        reject(
          new Error(`Ошибка при запросе к сервису модерации: ${error.message}`),
        );
      });

      if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
        request.setTimeout(timeoutMs, () => {
          request.destroy(
            new Error(`Сервис модерации не ответил за ${timeoutMs}мс`),
          );
        });
      }

      request.write(params.payload);
      request.end();
    });
  }

  private resolveModerationTimeout(_imageCount: number): number {
    const timeoutEnv = process.env.IMAGE_MODERATION_TIMEOUT_MS;

    if (timeoutEnv && timeoutEnv.trim().length > 0) {
      const normalized = timeoutEnv.trim().toLowerCase();

      if (
        ![
          '0',
          'off',
          'none',
          'no',
          'disable',
          'disabled',
          'infinite',
          'infinity',
          'unlimited',
        ].includes(normalized)
      ) {
        this.logger.warn(
          `Параметр IMAGE_MODERATION_TIMEOUT_MS=${timeoutEnv} игнорируется: ожидание ответа модерации без ограничения времени`,
        );
      }
    }

    const additionalTimeoutVars = [
      'IMAGE_MODERATION_BASE_TIMEOUT_MS',
      'IMAGE_MODERATION_TIMEOUT_PER_IMAGE_MS',
      'IMAGE_MODERATION_TIMEOUT_MAX_MS',
    ];

    for (const envName of additionalTimeoutVars) {
      const raw = process.env[envName];

      if (typeof raw === 'string' && raw.trim().length > 0) {
        this.logger.warn(
          `Параметр ${envName}=${raw} игнорируется: ожидание ответа модерации без ограничения времени`,
        );
      }
    }

    return 0;
  }

  private mapModerationResult(
    photo: PhotoForModeration,
    raw: unknown,
  ): ModerationResult {
    if (!raw || typeof raw !== 'object') {
      throw new Error(
        `Некорректный ответ модерации для фото ${photo.photoVkId}`,
      );
    }

    const payload = raw as Record<string, unknown>;

    const categories: string[] = [];
    this.collectCategory(categories, payload.category);
    this.collectCategory(categories, payload.subcategory);

    const explanation =
      typeof payload.description === 'string' &&
      payload.description.trim().length > 0
        ? payload.description.trim()
        : null;

    const confidence = this.extractConfidence(payload);
    const hasSuspicious = Boolean(payload.is_illegal);

    return {
      photoVkId: photo.photoVkId,
      photoUrl: photo.url,
      hasSuspicious,
      categories,
      explanation,
      confidence,
      rawResponse: raw,
    };
  }

  private collectCategory(target: string[], value: unknown): void {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => this.collectCategory(target, item));
      return;
    }

    if (typeof value === 'string') {
      const normalized = value.trim();

      if (normalized.length > 0) {
        target.push(normalized);
      }
    }
  }

  private extractConfidence(payload: Record<string, unknown>): number | null {
    const pct = this.toNumber(payload.confidencePct);

    if (pct !== null) {
      return this.normalizeConfidence(pct);
    }

    const rawConfidence = this.toNumber(payload.confidence);

    if (rawConfidence === null) {
      return null;
    }

    if (rawConfidence <= 1) {
      return this.normalizeConfidence(rawConfidence * 100);
    }

    return this.normalizeConfidence(rawConfidence);
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);

      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  private normalizeConfidence(value: number): number {
    if (!Number.isFinite(value)) {
      return value;
    }

    if (value < 0) {
      return 0;
    }

    if (value > 100) {
      return 100;
    }

    return Number(value.toFixed(2));
  }

  private determineSuspicionLevel(
    hasSuspicious: boolean,
    confidence: number | null | undefined,
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

      if (
        !lastAnalyzedAt ||
        new Date(item.analyzedAt) > new Date(lastAnalyzedAt)
      ) {
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
