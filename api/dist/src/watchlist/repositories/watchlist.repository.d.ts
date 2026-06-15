import { PrismaService } from '../../prisma.service.js';
import type { IWatchlistRepository, WatchlistAuthorWithRelations, WatchlistAuthorUpdateData, WatchlistSettingsRecord, WatchlistSettingsUpdateData } from '../interfaces/watchlist-repository.interface.js';
import type { Comment } from '../../generated/prisma/client.js';
import type { CommentSource } from '../../common/types/comment-source.enum.js';
import type { WatchlistStatus } from '../types/watchlist-status.enum.js';
export declare class WatchlistRepository implements IWatchlistRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: number): Promise<WatchlistAuthorWithRelations | null>;
    findByAuthorVkIdAndSettingsId(authorVkId: number, settingsId: number): Promise<WatchlistAuthorWithRelations | null>;
    findMany(params: {
        settingsId: number;
        excludeStopped?: boolean;
        offset: number;
        limit: number;
    }): Promise<{
        items: WatchlistAuthorWithRelations[];
        total: number;
    }>;
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
    update(id: number, data: WatchlistAuthorUpdateData): Promise<WatchlistAuthorWithRelations>;
    updateMany(ids: number[], data: WatchlistAuthorUpdateData): Promise<void>;
    countComments(watchlistAuthorId: number): Promise<number>;
    countCommentsByAuthorIds(authorIds: number[]): Promise<Map<number, number>>;
    getTrackedPosts(watchlistAuthorId: number, authorVkId: number): Promise<Array<{
        ownerId: number;
        postId: number;
    }>>;
    loadExistingCommentKeys(watchlistAuthorId: number, authorVkId: number): Promise<Set<string>>;
    ensureSettings(): Promise<WatchlistSettingsRecord>;
    getSettings(): Promise<WatchlistSettingsRecord | null>;
    updateSettings(id: number, data: WatchlistSettingsUpdateData): Promise<WatchlistSettingsRecord>;
    getAuthorComments(params: {
        watchlistAuthorId: number;
        offset: number;
        limit: number;
    }): Promise<{
        items: Comment[];
        total: number;
    }>;
    updateComment(id: number, data: {
        watchlistAuthorId: number;
        source: CommentSource;
    }): Promise<void>;
    findCommentById(id: number): Promise<{
        id: number;
        authorVkId: number | null;
        fromId: number;
    } | null>;
    private toWatchlistAuthorUpdateInput;
    private mapWatchlistAuthor;
    private mapWatchlistAuthors;
}
