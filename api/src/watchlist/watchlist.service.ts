import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  WatchlistStatus,
  type WatchlistSettings,
  CommentSource,
} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AuthorActivityService } from '../common/services/author-activity.service';
import { VkService } from '../vk/vk.service';
import { PhotoAnalysisService } from '../photo-analysis/photo-analysis.service';
import type { PhotoAnalysisSummaryDto } from '../photo-analysis/dto/photo-analysis-response.dto';
import { normalizeComment } from '../common/utils/comment-normalizer';
import type { CommentEntity } from '../common/types/comment-entity.type';
import {
  composeCommentKey,
  walkCommentTree,
} from './utils/watchlist-comment.utils';
import type {
  WatchlistAuthorCardDto,
  WatchlistAuthorDetailsDto,
  WatchlistAuthorListDto,
  WatchlistAuthorProfileDto,
  WatchlistCommentDto,
  WatchlistCommentsListDto,
  WatchlistSettingsDto,
} from './dto/watchlist-author.dto';
import { CreateWatchlistAuthorDto } from './dto/create-watchlist-author.dto';
import { UpdateWatchlistAuthorDto } from './dto/update-watchlist-author.dto';
import { UpdateWatchlistSettingsDto } from './dto/update-watchlist-settings.dto';

const DEFAULT_SETTINGS_ID = 1;
const DEFAULT_POLL_INTERVAL_MINUTES = 5;
const DEFAULT_MAX_AUTHORS = 50;

const WATCHLIST_PAGE_SIZE = 20;

type WatchlistAuthorWithRelations = Prisma.WatchlistAuthorGetPayload<{
  include: {
    author: true;
    settings: true;
  };
}>;

@Injectable()
export class WatchlistService {
  private readonly logger = new Logger(WatchlistService.name);
  private lastRefreshTimestamp = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorActivityService: AuthorActivityService,
    private readonly vkService: VkService,
    private readonly photoAnalysisService: PhotoAnalysisService,
  ) {}

  async getAuthors(
    params: { offset?: number; limit?: number } = {},
  ): Promise<WatchlistAuthorListDto> {
    const settings = await this.ensureSettings();
    const offset = Math.max(params.offset ?? 0, 0);
    const limit = Math.min(
      Math.max(params.limit ?? WATCHLIST_PAGE_SIZE, 1),
      200,
    );

    const [records, total] = await this.prisma.$transaction([
      this.prisma.watchlistAuthor.findMany({
        where: { settingsId: settings.id },
        include: { author: true, settings: true },
        orderBy: [
          { status: 'asc' },
          { lastCheckedAt: 'asc' },
          { updatedAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      this.prisma.watchlistAuthor.count({ where: { settingsId: settings.id } }),
    ]);

    const commentCounts = await this.collectCommentCounts(
      records.map((record) => record.id),
    );
    const summaryMap = await this.collectAnalysisSummaries(records);

    const items = records.map((record) =>
      this.mapAuthor(
        record,
        commentCounts.get(record.id) ?? 0,
        this.resolveSummary(record, summaryMap),
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
    const record = await this.prisma.watchlistAuthor.findUnique({
      where: { id },
      include: { author: true, settings: true },
    });

    if (!record) {
      throw new NotFoundException('Автор списка "На карандаше" не найден');
    }

    const offset = Math.max(params.offset ?? 0, 0);
    const limit = Math.min(
      Math.max(params.limit ?? WATCHLIST_PAGE_SIZE, 1),
      200,
    );

    const [comments, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where: { watchlistAuthorId: id },
        orderBy: { publishedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.comment.count({ where: { watchlistAuthorId: id } }),
    ]);

    const commentDtos: WatchlistCommentDto[] = comments.map((comment) => ({
      id: comment.id,
      ownerId: comment.ownerId,
      postId: comment.postId,
      vkCommentId: comment.vkCommentId,
      text: comment.text,
      publishedAt: comment.publishedAt?.toISOString() ?? null,
      createdAt: comment.createdAt.toISOString(),
      source: comment.source,
      commentUrl: this.buildCommentUrl(
        comment.ownerId,
        comment.postId,
        comment.vkCommentId,
      ),
    }));

    const commentsList: WatchlistCommentsListDto = {
      items: commentDtos,
      total,
      hasMore: offset + commentDtos.length < total,
    };

    const summaryMap = await this.collectAnalysisSummaries([record]);

    return {
      ...this.mapAuthor(record, total, this.resolveSummary(record, summaryMap)),
      comments: commentsList,
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

    const settings = await this.ensureSettings();

    let authorVkId = dto.authorVkId ?? null;
    let sourceCommentId: number | null = null;

    if (typeof dto.commentId === 'number') {
      const comment = await this.prisma.comment.findUnique({
        where: { id: dto.commentId },
      });

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

    const existing = await this.prisma.watchlistAuthor.findUnique({
      where: {
        authorVkId_settingsId: {
          authorVkId,
          settingsId: settings.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Автор уже находится в списке "На карандаше"',
      );
    }

    await this.authorActivityService.saveAuthors([authorVkId]);

    const record = await this.prisma.watchlistAuthor.create({
      data: {
        authorVkId,
        sourceCommentId,
        settingsId: settings.id,
        status: WatchlistStatus.ACTIVE,
      },
      include: {
        author: true,
        settings: true,
      },
    });

    if (sourceCommentId) {
      await this.prisma.comment.update({
        where: { id: sourceCommentId },
        data: {
          watchlistAuthorId: record.id,
          source: CommentSource.WATCHLIST,
        },
      });
    }

    const commentsCount = await this.prisma.comment.count({
      where: { watchlistAuthorId: record.id },
    });

    this.logger.log(`Добавлен автор ${authorVkId} в список "На карандаше"`);

    const summaryMap = await this.collectAnalysisSummaries([record]);

    return this.mapAuthor(
      record,
      commentsCount,
      this.resolveSummary(record, summaryMap),
    );
  }

  async updateAuthor(
    id: number,
    dto: UpdateWatchlistAuthorDto,
  ): Promise<WatchlistAuthorCardDto> {
    const record = await this.prisma.watchlistAuthor.findUnique({
      where: { id },
      include: { author: true, settings: true },
    });

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
      const commentsCount = await this.prisma.comment.count({
        where: { watchlistAuthorId: id },
      });
      const summaryMap = await this.collectAnalysisSummaries([record]);
      return this.mapAuthor(
        record,
        commentsCount,
        this.resolveSummary(record, summaryMap),
      );
    }

    const updated = await this.prisma.watchlistAuthor.update({
      where: { id },
      data,
      include: { author: true, settings: true },
    });

    const commentsCount = await this.prisma.comment.count({
      where: { watchlistAuthorId: id },
    });

    const summaryMap = await this.collectAnalysisSummaries([updated]);

    return this.mapAuthor(
      updated,
      commentsCount,
      this.resolveSummary(updated, summaryMap),
    );
  }

  async getSettings(): Promise<WatchlistSettingsDto> {
    const settings = await this.ensureSettings();
    return this.mapSettings(settings);
  }

  async updateSettings(
    dto: UpdateWatchlistSettingsDto,
  ): Promise<WatchlistSettingsDto> {
    const settings = await this.ensureSettings();

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

    const updated = await this.prisma.watchlistSettings.update({
      where: { id: settings.id },
      data,
    });

    this.logger.log('Обновлены настройки мониторинга авторов');

    return this.mapSettings(updated);
  }

  async refreshActiveAuthors(): Promise<void> {
    const settings = await this.ensureSettings();

    if (this.shouldSkipRefresh(settings.pollIntervalMinutes)) {
      return;
    }

    this.lastRefreshTimestamp = Date.now();

    const activeAuthors = await this.prisma.watchlistAuthor.findMany({
      where: { settingsId: settings.id, status: WatchlistStatus.ACTIVE },
      include: { author: true, settings: true },
      orderBy: [{ lastCheckedAt: 'asc' }, { updatedAt: 'asc' }],
      take: Math.max(settings.maxAuthors, 1),
    });

    if (!activeAuthors.length) {
      return;
    }

    await this.authorActivityService.saveAuthors(
      activeAuthors.map((author) => author.authorVkId),
    );

    if (!settings.trackAllComments) {
      const timestamp = new Date();
      await this.prisma.watchlistAuthor.updateMany({
        where: { id: { in: activeAuthors.map((author) => author.id) } },
        data: { lastCheckedAt: timestamp },
      });
      this.logger.debug(
        'Мониторинг всех комментариев отключен, обновлены только метки проверки авторов',
      );
      return;
    }

    let totalNewComments = 0;

    for (const author of activeAuthors) {
      const newComments = await this.refreshAuthorRecord(author);
      totalNewComments += newComments;
    }

    this.logger.debug(
      `Обработано ${activeAuthors.length} авторов "На карандаше", найдено новых комментариев: ${totalNewComments}`,
    );
  }

  private async refreshAuthorRecord(
    record: WatchlistAuthorWithRelations,
  ): Promise<number> {
    const checkTimestamp = new Date();
    const updateData: Prisma.WatchlistAuthorUpdateInput = {
      lastCheckedAt: checkTimestamp,
    };

    let newComments = 0;
    let latestActivity: Date | null = record.lastActivityAt ?? null;

    try {
      const trackedPosts = await this.getTrackedPosts(record);

      if (!trackedPosts.length) {
        return 0;
      }

      const existingKeys = await this.loadExistingCommentKeys(record);
      const baseline = record.lastActivityAt ?? null;

      for (const post of trackedPosts) {
        const { addedCount, maxActivity } = await this.processAuthorPost(
          record,
          post,
          baseline,
          existingKeys,
        );

        newComments += addedCount;

        if (maxActivity && (!latestActivity || maxActivity > latestActivity)) {
          latestActivity = maxActivity;
        }
      }

      if (newComments > 0) {
        updateData.foundCommentsCount = { increment: newComments };
      }

      if (
        latestActivity &&
        (!record.lastActivityAt || latestActivity > record.lastActivityAt)
      ) {
        updateData.lastActivityAt = latestActivity;
      }

      if (newComments > 0) {
        this.logger.log(
          `Мониторинг автора ${record.authorVkId}: найдено ${newComments} новых комментариев`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Ошибка обновления автора ${record.authorVkId} в списке "На карандаше"`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      await this.prisma.watchlistAuthor.update({
        where: { id: record.id },
        data: updateData,
      });
    }

    return newComments;
  }

  private async processAuthorPost(
    record: WatchlistAuthorWithRelations,
    post: { ownerId: number; postId: number },
    baseline: Date | null,
    existingKeys: Set<string>,
  ): Promise<{ addedCount: number; maxActivity: Date | null }> {
    const comments = await this.fetchAuthorCommentsForPost(
      post.ownerId,
      post.postId,
      record.authorVkId,
      baseline,
    );

    if (!comments.length) {
      return { addedCount: 0, maxActivity: null };
    }

    await this.authorActivityService.saveComments(comments, {
      source: CommentSource.WATCHLIST,
      watchlistAuthorId: record.id,
    });

    let addedCount = 0;
    let maxActivity: Date | null = null;

    for (const comment of comments) {
      walkCommentTree(comment, (entity) => {
        if (!maxActivity || entity.publishedAt > maxActivity) {
          maxActivity = entity.publishedAt;
        }

        const key = composeCommentKey(entity.ownerId, entity.vkCommentId);

        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          addedCount += 1;
        }
      });
    }

    return { addedCount, maxActivity };
  }

  private async getTrackedPosts(
    record: WatchlistAuthorWithRelations,
  ): Promise<Array<{ ownerId: number; postId: number }>> {
    const grouped = await this.prisma.comment.groupBy({
      by: ['ownerId', 'postId'],
      where: {
        OR: [
          { watchlistAuthorId: record.id },
          { authorVkId: record.authorVkId },
        ],
      },
      _max: { publishedAt: true },
      orderBy: [{ _max: { publishedAt: 'desc' } }],
      take: 20,
    });

    const posts = grouped.map((item) => ({
      ownerId: item.ownerId,
      postId: item.postId,
    }));

    if (!posts.length && record.sourceCommentId) {
      const source = await this.prisma.comment.findUnique({
        where: { id: record.sourceCommentId },
        select: { ownerId: true, postId: true },
      });

      if (source) {
        posts.push({ ownerId: source.ownerId, postId: source.postId });
      }
    }

    return posts;
  }

  private async loadExistingCommentKeys(
    record: WatchlistAuthorWithRelations,
  ): Promise<Set<string>> {
    const existing = await this.prisma.comment.findMany({
      where: {
        OR: [
          { watchlistAuthorId: record.id },
          { authorVkId: record.authorVkId },
        ],
      },
      select: { ownerId: true, vkCommentId: true },
    });

    const keys = new Set<string>();

    for (const item of existing) {
      keys.add(composeCommentKey(item.ownerId, item.vkCommentId));
    }

    return keys;
  }

  private shouldSkipRefresh(pollIntervalMinutes: number): boolean {
    if (!this.lastRefreshTimestamp) {
      return false;
    }

    const interval = Math.max(pollIntervalMinutes, 1) * 60_000;
    const elapsed = Date.now() - this.lastRefreshTimestamp;

    return elapsed < interval;
  }

  private async fetchAuthorCommentsForPost(
    ownerId: number,
    postId: number,
    authorVkId: number,
    baseline: Date | null,
  ): Promise<CommentEntity[]> {
    const comments = await this.vkService.getAuthorCommentsForPost({
      ownerId,
      postId,
      authorVkId,
      baseline,
      batchSize: 100,
      maxPages: 5,
      threadItemsCount: 10,
    });

    if (!comments.length) {
      return [];
    }

    return comments.map((item) => normalizeComment(item));
  }

  private async ensureSettings(): Promise<WatchlistSettings> {
    const settings = await this.prisma.watchlistSettings.upsert({
      where: { id: DEFAULT_SETTINGS_ID },
      update: {},
      create: {
        id: DEFAULT_SETTINGS_ID,
        trackAllComments: false,
        pollIntervalMinutes: DEFAULT_POLL_INTERVAL_MINUTES,
        maxAuthors: DEFAULT_MAX_AUTHORS,
      },
    });

    return settings;
  }

  private async collectCommentCounts(
    authorIds: number[],
  ): Promise<Map<number, number>> {
    const map = new Map<number, number>();

    if (!authorIds.length) {
      return map;
    }

    const grouped = await this.prisma.comment.groupBy({
      by: ['watchlistAuthorId'],
      where: { watchlistAuthorId: { in: authorIds } },
      _count: { watchlistAuthorId: true },
    });

    for (const group of grouped) {
      if (typeof group.watchlistAuthorId === 'number') {
        map.set(group.watchlistAuthorId, group._count.watchlistAuthorId ?? 0);
      }
    }

    return map;
  }

  private async collectAnalysisSummaries(
    records: WatchlistAuthorWithRelations[],
  ): Promise<Map<number, PhotoAnalysisSummaryDto>> {
    const authorIds = Array.from(
      new Set(
        records
          .map((record) => record.author?.id)
          .filter((id): id is number => typeof id === 'number'),
      ),
    );

    if (!authorIds.length) {
      return new Map();
    }

    return this.photoAnalysisService.getSummariesByAuthorIds(authorIds);
  }

  private resolveSummary(
    record: WatchlistAuthorWithRelations,
    summaryMap: Map<number, PhotoAnalysisSummaryDto>,
  ): PhotoAnalysisSummaryDto {
    const authorId = record.author?.id;

    if (typeof authorId !== 'number') {
      return this.cloneSummary(this.photoAnalysisService.getEmptySummary());
    }

    const summary = summaryMap.get(authorId);

    if (!summary) {
      return this.cloneSummary(this.photoAnalysisService.getEmptySummary());
    }

    return this.cloneSummary(summary);
  }

  private cloneSummary(
    summary: PhotoAnalysisSummaryDto,
  ): PhotoAnalysisSummaryDto {
    return {
      total: summary.total,
      suspicious: summary.suspicious,
      lastAnalyzedAt: summary.lastAnalyzedAt,
      categories: summary.categories.map((item) => ({ ...item })),
      levels: summary.levels.map((item) => ({ ...item })),
    };
  }

  private mapAuthor(
    record: WatchlistAuthorWithRelations,
    commentsCount: number,
    summary: PhotoAnalysisSummaryDto,
  ): WatchlistAuthorCardDto {
    const profile = this.mapProfile(record);

    return {
      id: record.id,
      authorVkId: record.authorVkId,
      status: record.status,
      lastCheckedAt: record.lastCheckedAt
        ? record.lastCheckedAt.toISOString()
        : null,
      lastActivityAt: record.lastActivityAt
        ? record.lastActivityAt.toISOString()
        : null,
      foundCommentsCount: record.foundCommentsCount,
      totalComments: commentsCount,
      monitoringStartedAt: record.monitoringStartedAt.toISOString(),
      monitoringStoppedAt: record.monitoringStoppedAt
        ? record.monitoringStoppedAt.toISOString()
        : null,
      settingsId: record.settingsId,
      author: profile,
      analysisSummary: summary,
    };
  }

  private mapProfile(
    record: WatchlistAuthorWithRelations,
  ): WatchlistAuthorProfileDto {
    const author = record.author;

    const firstName = author?.firstName ?? '';
    const lastName = author?.lastName ?? '';
    const fullName =
      [firstName, lastName].filter(Boolean).join(' ').trim() ||
      `id${record.authorVkId}`;
    const avatar =
      author?.photo200Orig ?? author?.photo100 ?? author?.photo50 ?? null;
    const screenName = author?.screenName ?? null;
    const domain = author?.domain ?? null;

    const profileUrl = screenName
      ? `https://vk.com/${screenName}`
      : domain
        ? `https://vk.com/${domain}`
        : `https://vk.com/id${record.authorVkId}`;

    return {
      vkUserId: record.authorVkId,
      firstName,
      lastName,
      fullName,
      avatar,
      screenName,
      domain,
      profileUrl,
    };
  }

  private buildCommentUrl(
    ownerId: number,
    postId: number,
    vkCommentId: number | null,
  ): string | null {
    if (!ownerId || !postId) {
      return null;
    }

    const baseUrl = `https://vk.com/wall${ownerId}_${postId}`;

    if (!vkCommentId) {
      return baseUrl;
    }

    return `${baseUrl}?reply=${vkCommentId}`;
  }

  private mapSettings(settings: WatchlistSettings): WatchlistSettingsDto {
    return {
      id: settings.id,
      trackAllComments: settings.trackAllComments,
      pollIntervalMinutes: settings.pollIntervalMinutes,
      maxAuthors: settings.maxAuthors,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }
}
