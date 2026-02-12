import type { WatchlistStatus } from '../types/watchlist-status.enum.js';

export type WatchlistSettingsRecord = {
  id: number;
  trackAllComments: boolean;
  pollIntervalMinutes: number;
  maxAuthors: number;
  createdAt: Date;
  updatedAt: Date;
};

export type WatchlistAuthorUpdateData = {
  status?: WatchlistStatus;
  monitoringStoppedAt?: Date | null;
  lastCheckedAt?: Date | null;
  lastActivityAt?: Date | null;
  incrementFoundCommentsCount?: number;
};

export type WatchlistSettingsUpdateData = {
  trackAllComments?: boolean;
  pollIntervalMinutes?: number;
  maxAuthors?: number;
};

export interface WatchlistAuthorWithRelations {
  id: number;
  authorVkId: number;
  sourceCommentId: number | null;
  settingsId: number;
  status: WatchlistStatus;
  lastCheckedAt: Date | null;
  lastActivityAt: Date | null;
  foundCommentsCount: number;
  monitoringStartedAt: Date;
  monitoringStoppedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    vkUserId: number;
    firstName: string | null;
    lastName: string | null;
    photo50: string | null;
    photo100: string | null;
    photo200Orig: string | null;
    screenName: string | null;
    domain: string | null;
  } | null;
  settings: WatchlistSettingsRecord;
}

export interface IWatchlistRepository {
  findById(id: number): Promise<WatchlistAuthorWithRelations | null>;
  findByAuthorVkIdAndSettingsId(
    authorVkId: number,
    settingsId: number,
  ): Promise<WatchlistAuthorWithRelations | null>;
  findMany(params: {
    settingsId: number;
    excludeStopped?: boolean;
    offset: number;
    limit: number;
  }): Promise<{ items: WatchlistAuthorWithRelations[]; total: number }>;
  findActiveAuthors(params: {
    settingsId: number;
    limit: number;
  }): Promise<WatchlistAuthorWithRelations[]>;
  create(data: {
    authorVkId: number;
    sourceCommentId: number | null;
    settingsId: number;
    status: WatchlistStatus;
  }): Promise<WatchlistAuthorWithRelations>;
  update(
    id: number,
    data: WatchlistAuthorUpdateData,
  ): Promise<WatchlistAuthorWithRelations>;
  updateMany(ids: number[], data: WatchlistAuthorUpdateData): Promise<void>;
  countComments(watchlistAuthorId: number): Promise<number>;
  countCommentsByAuthorIds(authorIds: number[]): Promise<Map<number, number>>;
  getTrackedPosts(
    watchlistAuthorId: number,
    authorVkId: number,
  ): Promise<
    Array<{
      ownerId: number;
      postId: number;
    }>
  >;
  loadExistingCommentKeys(
    watchlistAuthorId: number,
    authorVkId: number,
  ): Promise<Set<string>>;
  ensureSettings(): Promise<WatchlistSettingsRecord>;
  getSettings(): Promise<WatchlistSettingsRecord | null>;
  updateSettings(
    id: number,
    data: WatchlistSettingsUpdateData,
  ): Promise<WatchlistSettingsRecord>;
  getAuthorComments(params: {
    watchlistAuthorId: number;
    offset: number;
    limit: number;
  }): Promise<{ items: unknown[]; total: number }>;
  updateComment(
    id: number,
    data: { watchlistAuthorId: number; source: string },
  ): Promise<void>;
  findCommentById(id: number): Promise<{
    id: number;
    authorVkId: number | null;
    fromId: number;
  } | null>;
}
