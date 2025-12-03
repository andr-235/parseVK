import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { WatchlistStatus, CommentSource } from '@prisma/client';
import type {
  WatchlistAuthorCardDto,
  WatchlistAuthorDetailsDto,
  WatchlistAuthorListDto,
  WatchlistSettingsDto,
} from './dto/watchlist-author.dto';
import { CreateWatchlistAuthorDto } from './dto/create-watchlist-author.dto';
import { UpdateWatchlistAuthorDto } from './dto/update-watchlist-author.dto';
import { UpdateWatchlistSettingsDto } from './dto/update-watchlist-settings.dto';
import type { IWatchlistRepository } from './interfaces/watchlist-repository.interface';
import { Inject } from '@nestjs/common';
import { WatchlistAuthorMapper } from './mappers/watchlist-author.mapper';
import { WatchlistSettingsMapper } from './mappers/watchlist-settings.mapper';
import { WatchlistStatsCollectorService } from './services/watchlist-stats-collector.service';
import { WatchlistAuthorRefresherService } from './services/watchlist-author-refresher.service';
import { WatchlistQueryValidator } from './validators/watchlist-query.validator';
import { AuthorActivityService } from '../common/services/author-activity.service';

/**
 * Сервис для управления списком отслеживаемых авторов ("На карандаше")
 *
 * Обеспечивает добавление авторов в watchlist, мониторинг их активности,
 * обновление настроек и сбор статистики.
 */
@Injectable()
export class WatchlistService {
  private readonly logger = new Logger(WatchlistService.name);
  private lastRefreshTimestamp = 0;

  constructor(
    @Inject('IWatchlistRepository')
    private readonly repository: IWatchlistRepository,
    private readonly authorMapper: WatchlistAuthorMapper,
    private readonly settingsMapper: WatchlistSettingsMapper,
    private readonly statsCollector: WatchlistStatsCollectorService,
    private readonly authorRefresher: WatchlistAuthorRefresherService,
    private readonly queryValidator: WatchlistQueryValidator,
    private readonly authorActivityService: AuthorActivityService,
  ) {}

  async getAuthors(
    params: {
      offset?: number;
      limit?: number;
      excludeStopped?: boolean;
    } = {},
  ): Promise<WatchlistAuthorListDto> {
    const settings = await this.repository.ensureSettings();
    const offset = this.queryValidator.normalizeOffset(params.offset);
    const limit = this.queryValidator.normalizeLimit(params.limit);
    const excludeStopped = this.queryValidator.normalizeExcludeStopped(
      params.excludeStopped,
    );

    const { items: records, total } = await this.repository.findMany({
      settingsId: settings.id,
      excludeStopped,
      offset,
      limit,
    });

    const commentCounts = await this.statsCollector.collectCommentCounts(
      records.map((record) => record.id),
    );
    const summaryMap =
      await this.statsCollector.collectAnalysisSummaries(records);

    const items = records.map((record) =>
      this.authorMapper.mapAuthor(
        record,
        commentCounts.get(record.id) ?? 0,
        this.statsCollector.resolveSummary(record, summaryMap),
      ),
    );

    return {
      items,
      total,
      hasMore: offset + items.length < total,
    };
  }

  async getAuthorDetails(
    id: number,
    params: { offset?: number; limit?: number } = {},
  ): Promise<WatchlistAuthorDetailsDto> {
    const record = await this.repository.findById(id);

    if (!record) {
      throw new NotFoundException('Автор списка "На карандаше" не найден');
    }

    const offset = this.queryValidator.normalizeOffset(params.offset);
    const limit = this.queryValidator.normalizeLimit(params.limit);

    const { items: comments, total } = await this.repository.getAuthorComments({
      watchlistAuthorId: id,
      offset,
      limit,
    });

    const commentDtos = comments.map((comment) =>
      this.authorMapper.mapComment(comment as any),
    );

    const summaryMap = await this.statsCollector.collectAnalysisSummaries([
      record,
    ]);

    return {
      ...this.authorMapper.mapAuthor(
        record,
        total,
        this.statsCollector.resolveSummary(record, summaryMap),
      ),
      comments: {
        items: commentDtos,
        total,
        hasMore: offset + commentDtos.length < total,
      },
    };
  }

  async createAuthor(
    dto: CreateWatchlistAuthorDto,
  ): Promise<WatchlistAuthorCardDto> {
    if (
      typeof dto.commentId !== 'number' &&
      typeof dto.authorVkId !== 'number'
    ) {
      throw new BadRequestException('Нужно указать commentId или authorVkId');
    }

    const settings = await this.repository.ensureSettings();

    let authorVkId = dto.authorVkId ?? null;
    let sourceCommentId: number | null = null;

    if (typeof dto.commentId === 'number') {
      const comment = await this.repository.findCommentById(dto.commentId);

      if (!comment) {
        throw new NotFoundException('Комментарий не найден');
      }

      sourceCommentId = comment.id;
      authorVkId =
        comment.authorVkId ?? (comment.fromId > 0 ? comment.fromId : null);

      if (!authorVkId) {
        throw new BadRequestException(
          'Не удалось определить автора по указанному комментарию',
        );
      }
    }

    if (!authorVkId || authorVkId <= 0) {
      throw new BadRequestException(
        'Идентификатор автора должен быть положительным числом',
      );
    }

    const existing = await this.repository.findByAuthorVkIdAndSettingsId(
      authorVkId,
      settings.id,
    );

    if (existing) {
      throw new ConflictException(
        'Автор уже находится в списке "На карандаше"',
      );
    }

    await this.authorActivityService.saveAuthors([authorVkId]);

    const record = await this.repository.create({
      authorVkId,
      sourceCommentId,
      settingsId: settings.id,
      status: WatchlistStatus.ACTIVE,
    });

    if (sourceCommentId) {
      await this.repository.updateComment(sourceCommentId, {
        watchlistAuthorId: record.id,
        source: CommentSource.WATCHLIST,
      });
    }

    const commentsCount = await this.repository.countComments(record.id);

    this.logger.log(`Добавлен автор ${authorVkId} в список "На карандаше"`);

    const summaryMap = await this.statsCollector.collectAnalysisSummaries([
      record,
    ]);

    return this.authorMapper.mapAuthor(
      record,
      commentsCount,
      this.statsCollector.resolveSummary(record, summaryMap),
    );
  }

  async updateAuthor(
    id: number,
    dto: UpdateWatchlistAuthorDto,
  ): Promise<WatchlistAuthorCardDto> {
    const record = await this.repository.findById(id);

    if (!record) {
      throw new NotFoundException('Автор списка "На карандаше" не найден');
    }

    const data: Prisma.WatchlistAuthorUpdateInput = {};

    if (dto.status && dto.status !== record.status) {
      data.status = dto.status;

      if (dto.status === WatchlistStatus.ACTIVE) {
        data.monitoringStoppedAt = { set: null };
      } else if (dto.status === WatchlistStatus.STOPPED) {
        data.monitoringStoppedAt = { set: new Date() };
      }
    }

    if (Object.keys(data).length === 0) {
      const commentsCount = await this.repository.countComments(id);
      const summaryMap = await this.statsCollector.collectAnalysisSummaries([
        record,
      ]);
      return this.authorMapper.mapAuthor(
        record,
        commentsCount,
        this.statsCollector.resolveSummary(record, summaryMap),
      );
    }

    const updated = await this.repository.update(id, data);
    const commentsCount = await this.repository.countComments(id);
    const summaryMap = await this.statsCollector.collectAnalysisSummaries([
      updated,
    ]);

    return this.authorMapper.mapAuthor(
      updated,
      commentsCount,
      this.statsCollector.resolveSummary(updated, summaryMap),
    );
  }

  async getSettings(): Promise<WatchlistSettingsDto> {
    const settings = await this.repository.ensureSettings();
    return this.settingsMapper.map(settings);
  }

  async updateSettings(
    dto: UpdateWatchlistSettingsDto,
  ): Promise<WatchlistSettingsDto> {
    const settings = await this.repository.ensureSettings();

    const data: Prisma.WatchlistSettingsUpdateInput = {};

    if (typeof dto.trackAllComments === 'boolean') {
      data.trackAllComments = dto.trackAllComments;
    }

    if (typeof dto.pollIntervalMinutes === 'number') {
      data.pollIntervalMinutes = dto.pollIntervalMinutes;
    }

    if (typeof dto.maxAuthors === 'number') {
      data.maxAuthors = dto.maxAuthors;
    }

    const updated = await this.repository.updateSettings(settings.id, data);

    this.logger.log('Обновлены настройки мониторинга авторов');

    return this.settingsMapper.map(updated);
  }

  async refreshActiveAuthors(): Promise<void> {
    const settings = await this.repository.ensureSettings();

    if (this.shouldSkipRefresh(settings.pollIntervalMinutes)) {
      return;
    }

    this.lastRefreshTimestamp = Date.now();

    const activeAuthors = await this.repository.findActiveAuthors({
      settingsId: settings.id,
      limit: Math.max(settings.maxAuthors, 1),
    });

    if (!activeAuthors.length) {
      return;
    }

    await this.authorActivityService.saveAuthors(
      activeAuthors.map((author) => author.authorVkId),
    );

    if (!settings.trackAllComments) {
      const timestamp = new Date();
      await this.repository.updateMany(
        activeAuthors.map((author) => author.id),
        { lastCheckedAt: timestamp },
      );
      this.logger.debug(
        'Мониторинг всех комментариев отключен, обновлены только метки проверки авторов',
      );
      return;
    }

    let totalNewComments = 0;

    for (const author of activeAuthors) {
      const newComments =
        await this.authorRefresher.refreshAuthorRecord(author);
      totalNewComments += newComments;
    }

    this.logger.debug(
      `Обработано ${activeAuthors.length} авторов "На карандаше", найдено новых комментариев: ${totalNewComments}`,
    );
  }

  private shouldSkipRefresh(pollIntervalMinutes: number): boolean {
    if (!this.lastRefreshTimestamp) {
      return false;
    }

    const interval = Math.max(pollIntervalMinutes, 1) * 60_000;
    const elapsed = Date.now() - this.lastRefreshTimestamp;

    return elapsed < interval;
  }
}
