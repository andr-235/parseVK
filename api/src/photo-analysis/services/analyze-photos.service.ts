import { Inject, Injectable, Logger } from '@nestjs/common';
import { VkService } from '../../vk/vk.service.js';
import type { VkPhoto } from '../../vk/vk.service.js';
import type {
  AnalyzePhotosCommand,
  IAnalyzePhotosCommandHandler,
} from '../commands/analyze-photos.command.js';
import type { PhotoAnalysisListDto } from '../dto/photo-analysis-response.dto.js';
import type { IPhotoAnalysisRepository } from '../interfaces/photo-analysis-repository.interface.js';
import type {
  IAuthorService,
  IPhotoLoader,
} from '../interfaces/photo-loader.interface.js';
import type {
  IModerationService,
  ModerationResult,
} from '../interfaces/moderation-service.interface.js';
import { PhotoAnalysisFactory } from '../factories/photo-analysis.factory.js';
import { PhotoAnalysisSummaryBuilder } from '../builders/photo-analysis-summary.builder.js';

interface PhotoForModeration {
  photoVkId: string;
  url: string;
}

@Injectable()
export class AnalyzePhotosService implements IAnalyzePhotosCommandHandler {
  private readonly logger = new Logger(AnalyzePhotosService.name);

  constructor(
    @Inject('IPhotoAnalysisRepository')
    private readonly repository: IPhotoAnalysisRepository,
    @Inject('IAuthorService')
    private readonly authorService: IAuthorService,
    @Inject('IPhotoLoader')
    private readonly photoLoader: IPhotoLoader,
    @Inject('IModerationService')
    private readonly moderationService: IModerationService,
    private readonly factory: PhotoAnalysisFactory,
    private readonly summaryBuilder: PhotoAnalysisSummaryBuilder,
    private readonly vkService: VkService,
  ) {}

  async execute(command: AnalyzePhotosCommand): Promise<PhotoAnalysisListDto> {
    this.validateCommand(command);
    const options = this.normalizeOptions(command.options);

    const startTime = Date.now();
    const { vkUserId } = command;
    const { limit, force, offset } = options;

    this.logger.log(
      `Начало анализа фото для пользователя vkUserId=${vkUserId}, limit=${limit ?? 'all'}, offset=${offset}, force=${force}`,
    );

    const author = await this.authorService.findAuthorByVkId(vkUserId);
    const photos = await this.photoLoader.loadUserPhotos({
      userId: author.vkUserId,
      offset,
      limit: limit ?? undefined,
    });

    this.logger.log(
      `Получено ${photos.length} фото автора ${author.id} (vkUserId=${author.vkUserId}) для анализа`,
    );

    const photosForModeration = this.preparePhotosForModeration(photos);
    const photosToAnalyze = await this.filterAlreadyProcessedPhotos(
      author.id,
      photosForModeration,
      force,
    );

    if (!photosToAnalyze.length) {
      this.logger.log(
        'Нет новых фото для анализа — запрос к модерации не выполнялся',
      );
      await this.repository.markAuthorVerified(author.id);
      return this.getAnalysisList(vkUserId);
    }

    const moderationResults = await this.performModeration(photosToAnalyze);
    await this.saveAnalysisResults(author.id, moderationResults);

    const totalElapsed = Date.now() - startTime;
    const totalElapsedSec = (totalElapsed / 1000).toFixed(2);
    this.logger.log(
      `Анализ фото завершен за ${totalElapsedSec}s. Статистика: успешно=${moderationResults.length}, всего фото=${photos.length}`,
    );

    await this.repository.markAuthorVerified(author.id);
    return this.getAnalysisList(vkUserId);
  }

  private validateCommand(command: AnalyzePhotosCommand): void {
    if (!command.vkUserId || command.vkUserId <= 0) {
      throw new Error('Некорректный vkUserId');
    }
  }

  private normalizeOptions(options?: {
    limit?: number;
    force?: boolean;
    offset?: number;
  }): {
    limit: number | null;
    force: boolean;
    offset: number;
  } {
    const { limit, force = false, offset = 0 } = options ?? {};
    const normalizedLimit =
      typeof limit === 'number' ? Math.min(Math.max(limit, 1), 200) : null;

    return {
      limit: normalizedLimit,
      force,
      offset: Math.max(offset, 0),
    };
  }

  private preparePhotosForModeration(photos: VkPhoto[]): PhotoForModeration[] {
    const photosForModeration: PhotoForModeration[] = [];

    for (const photo of photos) {
      const photoUrl = this.vkService.getMaxPhotoSize(photo.sizes);

      if (!photoUrl) {
        this.logger.warn(
          `Не найден URL изображения для фото ${photo.photo_id}`,
        );
        continue;
      }

      photosForModeration.push({
        photoVkId: String(photo.photo_id),
        url: photoUrl,
      });
    }

    return photosForModeration;
  }

  private async filterAlreadyProcessedPhotos(
    authorId: number,
    photos: PhotoForModeration[],
    force: boolean,
  ): Promise<PhotoForModeration[]> {
    if (force) {
      return photos;
    }

    const existingPhotoVkIds = await this.repository.findExistingAnalyses(
      authorId,
      photos.map((p) => p.photoVkId),
    );

    const processed = new Set(existingPhotoVkIds);
    return photos.filter((photo) => !processed.has(photo.photoVkId));
  }

  private async performModeration(
    photos: PhotoForModeration[],
  ): Promise<ModerationResult[]> {
    try {
      return await this.moderationService.moderatePhotos(
        photos.map((p) => p.url),
      );
    } catch (error) {
      this.logger.error(
        'Не удалось получить ответ модерации',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  private async saveAnalysisResults(
    authorId: number,
    results: ModerationResult[],
  ): Promise<void> {
    for (const result of results) {
      try {
        const suspicionLevel = this.factory.createSuspicionLevel(
          result.hasSuspicious,
          result.confidence,
        );
        const categories = this.factory.createCategories(result.categories);

        await this.repository.saveAnalysis({
          authorId,
          photoUrl: result.photoUrl,
          photoVkId: result.photoVkId,
          hasSuspicious: result.hasSuspicious,
          suspicionLevel: suspicionLevel as string,
          categories,
          confidence: result.confidence,
          explanation: result.explanation,
          rawResponse: result.rawResponse,
        });

        this.logger.log(
          `Фото ${result.photoVkId} проанализировано успешно, уровень: ${suspicionLevel}`,
        );
      } catch (error) {
        this.logger.error(
          `Ошибка анализа фото ${result.photoVkId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  private async getAnalysisList(
    vkUserId: number,
  ): Promise<PhotoAnalysisListDto> {
    const analyses = await this.repository.findByAuthorId(vkUserId);
    const summary = this.summaryBuilder.reset().addItems(analyses).build();

    return {
      items: analyses,
      total: analyses.length,
      suspiciousCount: summary.suspicious,
      analyzedCount: analyses.length,
      summary,
    };
  }
}
