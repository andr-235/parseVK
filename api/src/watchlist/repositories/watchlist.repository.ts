import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import type {
  IWatchlistRepository,
  WatchlistAuthorWithRelations,
} from '../interfaces/watchlist-repository.interface';
import type { CommentSource, Prisma, WatchlistStatus } from '@prisma/client';
import { WatchlistStatus as WS } from '@prisma/client';
import { composeCommentKey } from '../utils/watchlist-comment.utils';

const DEFAULT_SETTINGS_ID = 1;

@Injectable()
export class WatchlistRepository implements IWatchlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: number): Promise<WatchlistAuthorWithRelations | null> {
    return this.prisma.watchlistAuthor.findUnique({
      where: { id },
      include: { author: true, settings: true },
    }) as Promise<WatchlistAuthorWithRelations | null>;
  }

  findByAuthorVkIdAndSettingsId(
    authorVkId: number,
    settingsId: number,
  ): Promise<WatchlistAuthorWithRelations | null> {
    return this.prisma.watchlistAuthor.findUnique({
      where: {
        authorVkId_settingsId: {
          authorVkId,
          settingsId,
        },
      },
      include: { author: true, settings: true },
    }) as Promise<WatchlistAuthorWithRelations | null>;
  }

  async findMany(params: {
    settingsId: number;
    excludeStopped?: boolean;
    offset: number;
    limit: number;
  }): Promise<{ items: WatchlistAuthorWithRelations[]; total: number }> {
    const where: Prisma.WatchlistAuthorWhereInput = {
      settingsId: params.settingsId,
    };
    if (params.excludeStopped) {
      where.status = { not: WS.STOPPED };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.watchlistAuthor.findMany({
        where,
        include: { author: true, settings: true },
        orderBy: [
          { status: 'asc' },
          { lastCheckedAt: 'asc' },
          { updatedAt: 'desc' },
        ],
        skip: params.offset,
        take: params.limit,
      }),
      this.prisma.watchlistAuthor.count({ where }),
    ]);

    return {
      items: items as WatchlistAuthorWithRelations[],
      total,
    };
  }

  findActiveAuthors(params: {
    settingsId: number;
    limit: number;
  }): Promise<WatchlistAuthorWithRelations[]> {
    return this.prisma.watchlistAuthor.findMany({
      where: { settingsId: params.settingsId, status: WS.ACTIVE },
      include: { author: true, settings: true },
      orderBy: [{ lastCheckedAt: 'asc' }, { updatedAt: 'asc' }],
      take: Math.max(params.limit, 1),
    }) as Promise<WatchlistAuthorWithRelations[]>;
  }

  create(data: {
    authorVkId: number;
    sourceCommentId: number | null;
    settingsId: number;
    status: WatchlistStatus;
  }): Promise<WatchlistAuthorWithRelations> {
    return this.prisma.watchlistAuthor.create({
      data,
      include: { author: true, settings: true },
    }) as Promise<WatchlistAuthorWithRelations>;
  }

  update(
    id: number,
    data: Prisma.WatchlistAuthorUpdateInput,
  ): Promise<WatchlistAuthorWithRelations> {
    return this.prisma.watchlistAuthor.update({
      where: { id },
      data,
      include: { author: true, settings: true },
    }) as Promise<WatchlistAuthorWithRelations>;
  }

  async updateMany(
    ids: number[],
    data: Prisma.WatchlistAuthorUpdateInput,
  ): Promise<void> {
    await this.prisma.watchlistAuthor.updateMany({
      where: { id: { in: ids } },
      data,
    });
  }

  countComments(watchlistAuthorId: number): Promise<number> {
    return this.prisma.comment.count({
      where: { watchlistAuthorId },
    });
  }

  async getTrackedPosts(
    watchlistAuthorId: number,
    authorVkId: number,
  ): Promise<Array<{ ownerId: number; postId: number }>> {
    const grouped = await this.prisma.comment.groupBy({
      by: ['ownerId', 'postId'],
      where: {
        OR: [{ watchlistAuthorId }, { authorVkId }],
      },
      _max: { publishedAt: true },
      orderBy: [{ _max: { publishedAt: 'desc' } }],
      take: 20,
    });

    return grouped.map((item) => ({
      ownerId: item.ownerId,
      postId: item.postId,
    }));
  }

  async loadExistingCommentKeys(
    watchlistAuthorId: number,
    authorVkId: number,
  ): Promise<Set<string>> {
    const existing = await this.prisma.comment.findMany({
      where: {
        OR: [{ watchlistAuthorId }, { authorVkId }],
      },
      select: { ownerId: true, vkCommentId: true },
    });

    const keys = new Set<string>();
    for (const item of existing) {
      keys.add(composeCommentKey(item.ownerId, item.vkCommentId));
    }

    return keys;
  }

  ensureSettings(): Promise<
    Prisma.WatchlistSettingsGetPayload<Record<string, never>>
  > {
    return this.prisma.watchlistSettings.upsert({
      where: { id: DEFAULT_SETTINGS_ID },
      update: {},
      create: {
        id: DEFAULT_SETTINGS_ID,
        trackAllComments: false,
        pollIntervalMinutes: 5,
        maxAuthors: 50,
      },
    });
  }

  getSettings(): Promise<{
    id: number;
    trackAllComments: boolean;
    pollIntervalMinutes: number;
    maxAuthors: number;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    return this.prisma.watchlistSettings.findUnique({
      where: { id: DEFAULT_SETTINGS_ID },
    }) as Promise<{
      id: number;
      trackAllComments: boolean;
      pollIntervalMinutes: number;
      maxAuthors: number;
      createdAt: Date;
      updatedAt: Date;
    } | null>;
  }

  updateSettings(
    id: number,
    data: Prisma.WatchlistSettingsUpdateInput,
  ): Promise<{
    id: number;
    trackAllComments: boolean;
    pollIntervalMinutes: number;
    maxAuthors: number;
    createdAt: Date;
    updatedAt: Date;
  }> {
    return this.prisma.watchlistSettings.update({
      where: { id },
      data,
    }) as Promise<{
      id: number;
      trackAllComments: boolean;
      pollIntervalMinutes: number;
      maxAuthors: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }

  async getAuthorComments(params: {
    watchlistAuthorId: number;
    offset: number;
    limit: number;
  }): Promise<{ items: unknown[]; total: number }> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where: { watchlistAuthorId: params.watchlistAuthorId },
        orderBy: { publishedAt: 'desc' },
        skip: params.offset,
        take: params.limit,
      }),
      this.prisma.comment.count({
        where: { watchlistAuthorId: params.watchlistAuthorId },
      }),
    ]);

    return { items, total };
  }

  async updateComment(
    id: number,
    data: { watchlistAuthorId: number; source: string },
  ): Promise<void> {
    await this.prisma.comment.update({
      where: { id },
      data: {
        watchlistAuthorId: data.watchlistAuthorId,
        source: data.source as CommentSource,
      },
    });
  }

  findCommentById(id: number): Promise<{
    id: number;
    authorVkId: number | null;
    fromId: number;
  } | null> {
    return this.prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        authorVkId: true,
        fromId: true,
      },
    });
  }
}
