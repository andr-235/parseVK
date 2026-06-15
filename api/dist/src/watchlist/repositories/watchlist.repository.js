var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { WatchlistStatus as WS, } from '../../generated/prisma/client.js';
import { composeCommentKey } from '../utils/watchlist-comment.utils.js';
import { WATCHLIST_MAX_TRACKED_POSTS } from '../constants/watchlist.constants.js';
const DEFAULT_SETTINGS_ID = 1;
let WatchlistRepository = class WatchlistRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const record = await this.prisma.watchlistAuthor.findUnique({
            where: { id },
            include: { author: true, settings: true },
        });
        return this.mapWatchlistAuthor(record);
    }
    async findByAuthorVkIdAndSettingsId(authorVkId, settingsId) {
        const record = await this.prisma.watchlistAuthor.findUnique({
            where: {
                authorVkId_settingsId: {
                    authorVkId,
                    settingsId,
                },
            },
            include: { author: true, settings: true },
        });
        return this.mapWatchlistAuthor(record);
    }
    async findMany(params) {
        const where = {
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
            items: this.mapWatchlistAuthors(items),
            total,
        };
    }
    async findActiveAuthors(params) {
        const items = await this.prisma.watchlistAuthor.findMany({
            where: { settingsId: params.settingsId, status: WS.ACTIVE },
            include: { author: true, settings: true },
            orderBy: [{ lastCheckedAt: 'asc' }, { updatedAt: 'asc' }],
            take: Math.max(params.limit, 1),
        });
        return this.mapWatchlistAuthors(items);
    }
    async create(data) {
        const record = await this.prisma.watchlistAuthor.create({
            data: {
                ...data,
                status: data.status,
            },
            include: { author: true, settings: true },
        });
        return this.mapWatchlistAuthor(record);
    }
    async update(id, data) {
        const record = await this.prisma.watchlistAuthor.update({
            where: { id },
            data: this.toWatchlistAuthorUpdateInput(data),
            include: { author: true, settings: true },
        });
        return this.mapWatchlistAuthor(record);
    }
    async updateMany(ids, data) {
        await this.prisma.watchlistAuthor.updateMany({
            where: { id: { in: ids } },
            data: this.toWatchlistAuthorUpdateInput(data),
        });
    }
    countComments(watchlistAuthorId) {
        return this.prisma.comment.count({
            where: { watchlistAuthorId },
        });
    }
    async countCommentsByAuthorIds(authorIds) {
        const map = new Map();
        if (!authorIds.length) {
            return map;
        }
        const grouped = await this.prisma.comment.groupBy({
            by: ['watchlistAuthorId'],
            where: { watchlistAuthorId: { in: authorIds } },
            _count: { watchlistAuthorId: true },
            orderBy: { watchlistAuthorId: 'asc' },
        });
        for (const group of grouped) {
            if (typeof group.watchlistAuthorId === 'number') {
                map.set(group.watchlistAuthorId, group._count.watchlistAuthorId ?? 0);
            }
        }
        return map;
    }
    async getTrackedPosts(watchlistAuthorId, authorVkId) {
        const grouped = await this.prisma.comment.groupBy({
            by: ['ownerId', 'postId'],
            where: {
                OR: [{ watchlistAuthorId }, { authorVkId }],
            },
            _max: { publishedAt: true },
            orderBy: [{ _max: { publishedAt: 'desc' } }],
            take: WATCHLIST_MAX_TRACKED_POSTS,
        });
        return grouped.map((item) => ({
            ownerId: item.ownerId,
            postId: item.postId,
        }));
    }
    async loadExistingCommentKeys(watchlistAuthorId, authorVkId) {
        const existing = await this.prisma.comment.findMany({
            where: {
                OR: [{ watchlistAuthorId }, { authorVkId }],
            },
            select: { ownerId: true, vkCommentId: true },
        });
        const keys = new Set();
        for (const item of existing) {
            keys.add(composeCommentKey(item.ownerId, item.vkCommentId));
        }
        return keys;
    }
    ensureSettings() {
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
    getSettings() {
        return this.prisma.watchlistSettings.findUnique({
            where: { id: DEFAULT_SETTINGS_ID },
        });
    }
    updateSettings(id, data) {
        return this.prisma.watchlistSettings.update({
            where: { id },
            data,
        });
    }
    async getAuthorComments(params) {
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
    async updateComment(id, data) {
        await this.prisma.comment.update({
            where: { id },
            data: {
                watchlistAuthorId: data.watchlistAuthorId,
                source: data.source,
            },
        });
    }
    findCommentById(id) {
        return this.prisma.comment.findUnique({
            where: { id },
            select: {
                id: true,
                authorVkId: true,
                fromId: true,
            },
        });
    }
    toWatchlistAuthorUpdateInput(data) {
        const update = {};
        if (data.status !== undefined) {
            update.status = data.status;
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
    mapWatchlistAuthor(record) {
        if (!record) {
            return null;
        }
        return {
            ...record,
            status: record.status,
        };
    }
    mapWatchlistAuthors(records) {
        return records.map((record) => ({
            ...record,
            status: record.status,
        }));
    }
};
WatchlistRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], WatchlistRepository);
export { WatchlistRepository };
//# sourceMappingURL=watchlist.repository.js.map