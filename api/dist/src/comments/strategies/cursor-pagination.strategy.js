var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommentsFilterBuilder } from '../builders/comments-filter.builder.js';
import { CursorUtils } from '../dto/comments-cursor.dto.js';
import { CommentMapper } from '../mappers/comment.mapper.js';
import { CommentsStatsService } from '../services/comments-stats.service.js';
import { COMMENTS_REPOSITORY, } from '../interfaces/comments-repository.interface.js';
let CursorPaginationStrategy = class CursorPaginationStrategy {
    repository;
    filterBuilder;
    mapper;
    statsService;
    constructor(repository, filterBuilder, mapper, statsService) {
        this.repository = repository;
        this.filterBuilder = filterBuilder;
        this.mapper = mapper;
        this.statsService = statsService;
    }
    async execute(filters, options) {
        const { cursor, limit } = options;
        let cursorData = null;
        if (cursor) {
            cursorData = CursorUtils.decode(cursor);
            if (!cursorData) {
                throw new BadRequestException('Invalid cursor format');
            }
        }
        const baseWhere = this.filterBuilder.buildBaseWhere(filters);
        const readStatusWhere = this.filterBuilder.buildReadStatusWhere(filters.readStatus);
        const paginationWhere = cursorData
            ? {
                OR: [
                    {
                        createdAt: {
                            lt: cursorData.createdAt,
                        },
                    },
                    {
                        createdAt: cursorData.createdAt,
                        id: {
                            lt: cursorData.id,
                        },
                    },
                ],
            }
            : {};
        const listWhere = this.filterBuilder.mergeWhere(baseWhere, readStatusWhere, paginationWhere);
        const comments = await this.repository.findMany({
            where: listWhere,
            take: limit + 1,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        });
        const hasMore = comments.length > limit;
        const items = this.mapper.mapMany(comments.slice(0, limit));
        const lastItem = items.at(-1);
        const nextCursor = hasMore && lastItem
            ? CursorUtils.encode(lastItem.createdAt, lastItem.id)
            : null;
        const stats = await this.statsService.calculateStats(filters, filters.readStatus);
        return {
            items,
            nextCursor,
            hasMore,
            total: stats.total,
            readCount: stats.readCount,
            unreadCount: stats.unreadCount,
        };
    }
};
CursorPaginationStrategy = __decorate([
    Injectable(),
    __param(0, Inject(COMMENTS_REPOSITORY)),
    __metadata("design:paramtypes", [Object, CommentsFilterBuilder,
        CommentMapper,
        CommentsStatsService])
], CursorPaginationStrategy);
export { CursorPaginationStrategy };
//# sourceMappingURL=cursor-pagination.strategy.js.map