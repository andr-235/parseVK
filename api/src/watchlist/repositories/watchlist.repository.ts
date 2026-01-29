import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import type {
  IWatchlistRepository,
  WatchlistAuthorWithRelations,
  WatchlistAuthorUpdateData,
  WatchlistSettingsRecord,
  WatchlistSettingsUpdateData,
} from '../interfaces/watchlist-repository.interface.js';
import type { Comment, Prisma } from '../../generated/prisma/client.js';
import {
  CommentSource as PrismaCommentSource,
  WatchlistStatus as WS,
} from '../../generated/prisma/client.js';
import { composeCommentKey } from '../utils/watchlist-comment.utils.js';
import type { CommentSource } from '../../common/types/comment-source.enum.js';
import type { WatchlistStatus } from '../types/watchlist-status.enum.js';

const DEFAULT_SETTINGS_ID = 1;
type WatchlistAuthorRecord = Omit<WatchlistAuthorWithRelations, 'status'> & {
  status: WS;
};

@Injectable()
export class WatchlistRepository implements IWatchlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<WatchlistAuthorWithRelations | null> {
    const record = await this.prisma.watchlistAuthor.findUnique({
      where: { id },
      include: { author: true, settings: true },
    });
    return this.mapWatchlistAuthor(record as WatchlistAuthorRecord | null);
  }

  async findByAuthorVkIdAndSettingsId(
    authorVkId: number,
    settingsId: number,
  ): Promise<WatchlistAuthorWithRelations | null> {
    const record = await this.prisma.watchlistAuthor.findUnique({
      where: {
        authorVkId_settingsId: {
          authorVkId,
          settingsId,
        },
      },
      include: { author: true, settings: true },
    });
    return this.mapWatchlistAuthor(record as WatchlistAuthorRecord | null);
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
      items: this.mapWatchlistAuthors(items as WatchlistAuthorRecord[]),
      total,
    };
  }

  async findActiveAuthors(params: {
    settingsId: number;
    limit: number;
  }): Promise<WatchlistAuthorWithRelations[]> {
    const items = await this.prisma.watchlistAuthor.findMany({
      where: { settingsId: params.settingsId, status: WS.ACTIVE },
      include: { author: true, settings: true },
      orderBy: [{ lastCheckedAt: 'asc' }, { updatedAt: 'asc' }],
      take: Math.max(params.limit, 1),
    });
    return this.mapWatchlistAuthors(items as WatchlistAuthorRecord[]);
  }

  async create(data: {
    authorVkId: number;
    sourceCommentId: number | null;
    settingsId: number;
    status: WatchlistStatus;
  }): Promise<WatchlistAuthorWithRelations> {
    const record = await this.prisma.watchlistAuthor.create({
      data: {
        ...data,

        status: data.status as WS,
      },
      include: { author: true, settings: true },
    });
    return this.mapWatchlistAuthor(
      record as WatchlistAuthorRecord,
    ) as WatchlistAuthorWithRelations;
  }

  async update(
    id: number,
    data: WatchlistAuthorUpdateData,
  ): Promise<WatchlistAuthorWithRelations> {
    const record = await this.prisma.watchlistAuthor.update({
      where: { id },
      data: this.toWatchlistAuthorUpdateInput(data),
      include: { author: true, settings: true },
    });
    return this.mapWatchlistAuthor(
      record as WatchlistAuthorRecord,
    ) as WatchlistAuthorWithRelations;
  }

  async updateMany(
    ids: number[],
    data: WatchlistAuthorUpdateData,
  ): Promise<void> {
    await this.prisma.watchlistAuthor.updateMany({
      where: { id: { in: ids } },
      data: this.toWatchlistAuthorUpdateInput(data),
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

  ensureSettings(): Promise<WatchlistSettingsRecord> {
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

  getSettings(): Promise<WatchlistSettingsRecord | null> {
    return this.prisma.watchlistSettings.findUnique({
      where: { id: DEFAULT_SETTINGS_ID },
    });
  }

  updateSettings(
    id: number,
    data: WatchlistSettingsUpdateData,
  ): Promise<WatchlistSettingsRecord> {
    return this.prisma.watchlistSettings.update({
      where: { id },
      data,
    });
  }

  async getAuthorComments(params: {
    watchlistAuthorId: number;
    offset: number;
    limit: number;
  }): Promise<{ items: Comment[]; total: number }> {
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
    data: { watchlistAuthorId: number; source: CommentSource },
  ): Promise<void> {
    await this.prisma.comment.update({
      where: { id },
      data: {
        watchlistAuthorId: data.watchlistAuthorId,

        source: data.source as PrismaCommentSource,
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

  private toWatchlistAuthorUpdateInput(
    data: WatchlistAuthorUpdateData,
  ): Prisma.WatchlistAuthorUpdateInput {
    const update: Prisma.WatchlistAuthorUpdateInput = {};

    if (data.status !== undefined) {
      update.status = data.status as WS;
    }

    if (data.monitoringStoppedAt !== undefined) {
      update.monitoringStoppedAt = data.monitoringStoppedAt;
    }

    if (data.lastCheckedAt !== undefined) {
      update.lastCheckedAt = data.lastCheckedAt;
    }

    if (data.lastActivityAt !== undefined) {
      update.lastActivityAt = data.lastActivityAt;
    }

    if (data.incrementFoundCommentsCount !== undefined) {
      update.foundCommentsCount = {
        increment: data.incrementFoundCommentsCount,
      };
    }

    return update;
  }

  private mapWatchlistAuthor(
    record: WatchlistAuthorRecord | null,
  ): WatchlistAuthorWithRelations | null {
    if (!record) {
      return null;
    }
    return {
      ...record,
      status: record.status as WatchlistStatus,
    };
  }

  private mapWatchlistAuthors(
    records: WatchlistAuthorRecord[],
  ): WatchlistAuthorWithRelations[] {
    return records.map((record) => ({
      ...record,
      status: record.status as WatchlistStatus,
    }));
  }
}
